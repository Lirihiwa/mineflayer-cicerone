const CiceroneError = require('../errors/CiceroneError');

/**
 * A single step in a Path, associated with an action type and a target position.
 * */
class PathElement {
    /**
     * @param {import('vec3').Vec3} position
     * @param {string} type
     * */
    constructor(position, type) {
        this.position = position;
        this.type = type;
    }

    /**
     * Human-readable description of element.
     *
     * @returns {string}
     * */
    getInfo() {
        return `Type: ${this.type}, Position: ${this.position}`;
    }

    /**
     * Executes element's resolve action via the given registry.
     *
     * @param {import('./ActionRegistry')} actionRegistry
     * @returns {Promise<void>}
     * @throws {CiceroneError} If the registry has no resolver for this element's type, or if the resolver itself throws.
     * */
    async resolve(actionRegistry) {
        try {
            await actionRegistry.resolve(this.type, this.position);
        } catch (e) {
            throw new CiceroneError(`Unable to resolve [${this.getInfo()}]: ${e.message}`, {
                cause: e,
            });
        }
    }

    /**
     * Executes element's revert action via the given registry.
     *
     * @param {import('./ActionRegistry')} actionRegistry
     * @returns {Promise<void>}
     * @throws {CiceroneError} If the registry has no reverter for this element's type, or if the reverter itself throws.
     * */
    async revert(actionRegistry) {
        try {
            await actionRegistry.revert(this.type, this.position);
        } catch (e) {
            throw new CiceroneError(`Unable to revert [${this.getInfo()}]: ${e.message}`, {
                cause: e,
            });
        }
    }
}

module.exports = PathElement;
