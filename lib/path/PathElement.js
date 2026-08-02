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
        this.state = null;
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
     * Executes element's run action via the given registry.
     *
     * @param {import('./ActionRegistry')} actionRegistry
     * @returns {Promise<void>}
     * @throws {CiceroneError} If the registry has no run handler for this element's type, or if the run handler itself throws.
     * */
    async run(actionRegistry) {
        try {
            await actionRegistry.run(this.type, this.position, this);
        } catch (e) {
            throw new CiceroneError(`Unable to resolve [${this.getInfo()}]: ${e.message}`, {
                cause: e,
            });
        }
    }

    /**
     * Executes element's reverse action via the given registry.
     *
     * @param {import('./ActionRegistry')} actionRegistry
     * @returns {Promise<void>}
     * @throws {CiceroneError} If the registry has no reverse handler for this element's type, or if the reverse handler itself throws.
     * */
    async reverse(actionRegistry) {
        try {
            await actionRegistry.reverse(this.type, this.position, this);
        } catch (e) {
            throw new CiceroneError(`Unable to revert [${this.getInfo()}]: ${e.message}`, {
                cause: e,
            });
        }
    }
}

module.exports = PathElement;
