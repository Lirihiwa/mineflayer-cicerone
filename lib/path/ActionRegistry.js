const CiceroneError = require('../errors/CiceroneError');

/**
 * @typedef {(position: import('vec3').Vec3) => Promise<void>} ActionHandler
 * */

/**
 * A registry that maps path element types to their resolve and revert handlers.
 *
 * Built-in action types (move, dig, place, up, down, jumpOn) are registered by the CiceronePlugin plugin at injection time.
 * You can register additional custom action types using the `register()` method, without modifying the library's source code.
 * */
class ActionRegistry {
    constructor() {
        /** @type {Map<string, ActionHandler>} */
        this._runHandlers = new Map();

        /** @type {Map<string, ActionHandler>} */
        this._reverseHandlers = new Map();
    }

    /**
     * Registers a pair of handlers for the given action type.
     *
     * @param {string} type
     * @param {ActionHandler} runHandler
     * @param {ActionHandler} [reverseHandler]
     * @throws {CiceroneError} If type is not a non-empty string, or handlers are not functions.
     * */
    register(type, runHandler, reverseHandler = async () => {}) {
        if (typeof type !== 'string' || type.length === 0) {
            throw new CiceroneError('Action type must be a non-empty string.');
        }

        if (typeof runHandler !== 'function') {
            throw new CiceroneError(
                `Resolve handler for action type "${type}" must be a function.`,
            );
        }

        if (typeof reverseHandler !== 'function') {
            throw new CiceroneError(`Revert handler for action type "${type}" must be a function.`);
        }

        this._runHandlers.set(type, runHandler);
        this._reverseHandlers.set(type, reverseHandler);
    }

    /**
     * Removes a previously registered action type.
     *
     * @param {string} type
     * @returns {boolean} True if the type was registered before deletion.
     * */
    unregister(type) {
        this._reverseHandlers.delete(type);
        return this._runHandlers.delete(type);
    }

    /**
     * Checks if the specified action type is registered.
     *
     * @param {string} type
     * @returns {boolean}
     * */
    has(type) {
        return this._runHandlers.has(type);
    }

    /**
     * Lists all currently registered action types.
     *
     * @returns {string[]}
     * */
    list() {
        return Array.from(this._runHandlers.keys());
    }

    /**
     * Executes the run handler for the given action type.
     *
     * @param {string} type
     * @param {import('vec3').Vec3} position
     * @returns {Promise<void>}
     * @throws {CiceroneError} If no run handler is registered for the type.
     * */
    async run(type, position) {
        const handler = this._runHandlers.get(type);
        if (!handler) {
            throw new CiceroneError(`No run handler registered for action type: "${type}".`);
        }
        await handler(position);
    }

    /**
     * Executes the reverse handler for the given action type.
     *
     * @param {string} type
     * @param {import('vec3').Vec3} position
     * @returns {Promise<void>}
     * @throws {CiceroneError} If no reverse handler is registered for the type.
     * */
    async reverse(type, position) {
        const handler = this._reverseHandlers.get(type);
        if (!handler) {
            throw new CiceroneError(`No reverse registered for action type: "${type}".`);
        }
        await handler(position);
    }
}

module.exports = ActionRegistry;
