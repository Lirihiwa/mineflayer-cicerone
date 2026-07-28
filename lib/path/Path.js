const CiceroneError = require('../errors/CiceroneError');
const PathElement = require('./PathElement');
const ParentPathElement = require('./ParentPathElement');

/**
 * Represents an ordered sequence of actions the bot should perform to travel from one point to
 * another, and (optionally) reverse.
 *
 * A Path is a tree of ParentPathElements ("standpoints" — positions the bot physically stands
 * at) each optionally holding child PathElements ("actions performed at that standpoint", e.g.
 * digging or placing a block before moving on).
 *
 * Path itself contains no bot-specific logic: it delegates the actual execution of each element
 * to an ActionRegistry, and delegates structural decisions (does this action type create a new
 * standpoint? where?) to a PathStructureRegistry.
 * */
class Path {
    /**
     * @param {import('vec3').Vec3} startPosition - The bot's current position (bot.entity.position).
     * @param {import('./ActionRegistry')} actionRegistry
     * @param {import('./PathStructureRegistry')} structureRegistry
     * */
    constructor(startPosition, actionRegistry, structureRegistry) {
        this._actionRegistry = actionRegistry;
        this._structureRegistry = structureRegistry;

        const root = new ParentPathElement(startPosition.floored(), 'move');

        /** @type {ParentPathElement[]} */
        this.pathElements = [root];

        /** @type {ParentPathElement} */
        this.lastPathElement = root;
    }

    /**
     * Adds a new step to the path.
     *
     * @param {import('vec3').Vec3} position
     * @param {string} type
     * @throws {CiceroneError} If the type is not registered in the ActionRegistry.
     * */
    add(position, type) {
        if (!this._actionRegistry.has(type)) {
            throw new CiceroneError(
                `Unknown action type: "${type}". Register it via ActionRegistry.register() first.`,
            );
        }

        const descriptor = this._structureRegistry.get(type);

        if (descriptor.createsNewStandPoint) {
            const basePosition = descriptor.relativeToLastParent
                ? this.lastPathElement.position
                : position;

            const standPosition = descriptor.standOffset
                ? basePosition.plus(descriptor.standOffset)
                : basePosition.clone();

            const standPointType = descriptor.standPointType ?? type;
            const standPoint = new ParentPathElement(standPosition, standPointType);
            this.pathElements.push(standPoint);
            this.lastPathElement = standPoint;

            if (descriptor.attachAsChildOfNewStandPoint) {
                standPoint.addChild(new PathElement(standPosition, type));
            }

            return;
        }

        this.lastPathElement.addChild(new PathElement(position, type));
    }

    /**
     * Clears all steps and resets the path back to a single root standpoint at the given position.
     *
     * @param {import('vec3').Vec3} startPosition
     * */
    reset(startPosition) {
        const root = new ParentPathElement(startPosition.floored(), 'move');
        this.pathElements = [root];
        this.lastPathElement = root;
    }

    /**
     * Deep-clones the internal element tree, without cloning the registries.
     *
     * @private
     * @returns {ParentPathElement[]}
     * */
    _cloneElements() {
        return this.pathElements.map((parentElement) => {
            const parent = new ParentPathElement(
                parentElement.position.clone(),
                parentElement.type,
            );

            for (const child of parentElement.children) {
                parent.addChild(new PathElement(child.position.clone(), child.type));
            }

            return parent;
        });
    }

    /**
     * Executes the path: for each standpoint in order, first resolves its children
     * (actions performed at that standpoint), then resolves the standpoint itself (typically
     * the movement to reach it).
     *
     * Operates on a cloned copy of the element tree, so the original path is left untouched and
     * can be resolved or reverted multiple times.
     *
     * @returns {Promise<void>}
     * */
    async resolve() {
        const buffered = this._cloneElements();

        while (buffered.length > 0) {
            const currentParent = buffered.shift();

            while (currentParent.hasChildren()) {
                const child = currentParent.children.shift();
                await child.resolve(this._actionRegistry);
            }

            await currentParent.resolve(this._actionRegistry);
        }
    }

    /**
     * Executes the path in reverse: walks standpoints from last to first, reverting each
     * standpoint itself before reverting its children in reverse order.
     *
     * Operates on a cloned copy of the element tree, so the original path is left untouched and
     * can be resolved or reverted multiple times.
     *
     * @returns {Promise<void>}
     * */
    async revert() {
        const buffered = this._cloneElements();

        while (buffered.length > 0) {
            const currentParent = buffered.pop();
            await currentParent.revert(this._actionRegistry);

            while (currentParent.hasChildren()) {
                const child = currentParent.children.pop();
                await child.revert(this._actionRegistry);
            }
        }
    }

    /**
     * @returns {ParentPathElement[]}
     * */
    toJSON() {
        return this.pathElements;
    }

    /**
     * Reconstructs a Path from its JSON representation.
     *
     * @param {Array|string} json
     * @param {import('./ActionRegistry')} actionRegistry
     * @param {import('./PathStructureRegistry')} structureRegistry
     * @returns {Path}
     * */
    static fromJSON(json, actionRegistry, structureRegistry) {
        const rawElements = typeof json === 'string' ? JSON.parse(json) : json;

        if (!Array.isArray(rawElements) || rawElements.length === 0) {
            throw new CiceroneError('Cannot reconstruct Path from empty or invalid JSON.');
        }

        const { Vec3 } = require('vec3');
        const toVec3 = (raw) => new Vec3(raw.x, raw.y, raw.z);

        const rootPosition = toVec3(rawElements[0].position);
        const path = new Path(rootPosition, actionRegistry, structureRegistry);

        path.pathElements = rawElements.map((parentRaw) => {
            const parent = new ParentPathElement(toVec3(parentRaw.position), parentRaw.type);

            if (Array.isArray(parentRaw.children)) {
                for (const childRaw of parentRaw.children) {
                    parent.addChild(new PathElement(toVec3(childRaw.position), childRaw.type));
                }
            }

            return parent;
        });

        path.lastPathElement = path.pathElements[path.pathElements.length - 1];

        return path;
    }
}

module.exports = Path;
