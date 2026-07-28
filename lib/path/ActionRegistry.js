import CiceroneError from '../errors/CiceroneError';

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
        this._resolvers = new Map();

        /** @type {Map<string, ActionHandler>} */
        this._reverters = new Map();
    }

    /**
     * Registers a pair of handlers for the given action type.
     *
     * @param {string} type
     * @param {ActionHandler} resolveHandler
     * @param {ActionHandler} [revertHandler]
     * @throws {CiceroneError} If type is not a non-empty string, or handlers are not functions.
     * */
    register(type, resolveHandler, revertHandler = async () => {}) {
        if (typeof type !== 'string' || type.length === 0) {
            throw new CiceroneError('Action type must be a non-empty string.');
        }

        if (typeof resolveHandler !== 'function') {
            throw new CiceroneError(
                `Resolve handler for action type "${type}" must be a function.`,
            );
        }

        if (typeof revertHandler !== 'function') {
            throw new CiceroneError(`Revert handler for action type "${type}" must be a function.`);
        }

        this._resolvers.set(type, resolveHandler);
        this._reverters.set(type, revertHandler);
    }

    /**
     * Removes a previously registered action type.
     *
     * @param {string} type
     * @returns {boolean} True if the type was registered before deletion.
     * */
    unregister(type) {
        this._reverters.delete(type);
        return this._resolvers.delete(type);
    }

    /**
     * Checks if the specified action type is registered.
     *
     * @param {string} type
     * @returns {boolean}
     * */
    has(type) {
        return this._resolvers.has(type);
    }

    /**
     * Lists all currently registered action types.
     *
     * @returns {string[]}
     * */
    list() {
        return Array.from(this._resolvers.keys());
    }

    /**
     * Executes the resolve handler for the given action type.
     *
     * @param {string} type
     * @param {import('vec3').Vec3} position
     * @returns {Promise<void>}
     * @throws {CiceroneError} If no resolver is registered for the type.
     * */
    async resolve(type, position) {
        const handler = this._resolvers.get(type);
        if (!handler) {
            throw new CiceroneError(`No resolver registered for action type: "${type}".`);
        }
        await handler(position);
    }

    /**
     * Executes the revert handler for the given action type.
     *
     * @param {string} type
     * @param {import('vec3').Vec3} position
     * @returns {Promise<void>}
     * @throws {CiceroneError} If no reverter is registered for the type.
     * */
    async revert(type, position) {
        const handler = this._reverters.get(type);
        if (!handler) {
            throw new CiceroneError(`No reverter registered for action type: "${type}".`);
        }
        await handler(position);
    }
}

module.exports = ActionRegistry;
