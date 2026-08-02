const CiceroneError = require('../errors/CiceroneError');
const PathElement = require('./PathElement');

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
     * @param {import('./ActionRegistry')} actionRegistry
     * */
    constructor(actionRegistry) {
        this._actionRegistry = actionRegistry;
        /** @type {PathElement[]} */
        this.elements = [];
    }

    /**
     * Adds a new step to the path.
     *
     * @param {import('vec3').Vec3} position
     * @param {string} type
     * @param {Object} [state = null] - Optional additional information you want to use in the element
     * @returns {Path}
     * @throws {CiceroneError} If the type is not registered in the ActionRegistry.
     * */
    add(position, type, state = null) {
        if (!this._actionRegistry.has(type)) {
            throw new CiceroneError(
                `Unknown action type: "${type}". Register it via ActionRegistry.register() first.`,
            );
        }

        this.elements.push(new PathElement(position, type, state));
        return this;
    }

    /**
     * Clears all steps and resets the path back to a single root standpoint at the given position.
     *
     * @param {import('vec3').Vec3} startPosition
     * */
    reset() {
        this.elements = [];
    }

    /**
     * Creates a deep clone of this Path.
     *
     * @returns {Path}
     * */
    clone() {
        const cloned = new Path(this._actionRegistry);
        cloned.elements = this.elements.map(
            (el) => new PathElement(el.position, el.type, el.state),
        );
        return cloned;
    }

    /**
     * Run path.
     *
     * @returns {Promise<void>}
     * */
    async run() {
        for (const element of this.elements) {
            await element.run(this._actionRegistry);
        }
    }

    /**
     * Run path in reverse order.
     *
     * @returns {Promise<void>}
     * */
    async reverse() {
        for (let i = this.elements.length - 1; i >= 0; i--) {
            await this.elements[i].reverse(this._actionRegistry);
        }
    }

    /**
     * @returns {PathElement[]}
     * */
    toJSON() {
        return this.elements;
    }

    /**
     * Reconstructs a Path from its JSON representation.
     *
     * @param {Array|string} json
     * @param {import('./ActionRegistry')} actionRegistry
     * @returns {Path}
     * */
    static fromJSON(json, actionRegistry) {
        const rawElements = typeof json === 'string' ? JSON.parse(json) : json;

        if (!Array.isArray(rawElements)) {
            throw new CiceroneError('Cannot reconstruct Path from empty or invalid JSON.');
        }

        const { Vec3 } = require('vec3');
        const path = new Path(actionRegistry);

        path.elements = rawElements.map((el) => {
            return new PathElement(
                new Vec3(el.position.x, el.position.y, el.position.z),
                el.type,
                el.state,
            );
        });

        return path;
    }
}

module.exports = Path;
