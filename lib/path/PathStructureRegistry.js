const { Vec3 } = require('vec3');

/**
 * @typedef {Object} StructureDescriptor
 * @property {boolean} createsNewStandPoint - Create a new standpoint (parent) or attach as child.
 * @property {import('vec3').Vec3 | null} standOffset - Offset for the new standpoint.
 * @property {boolean} relativeToLastParent - Apply offset to the last parent instead of target.
 * @property {string | null} standPointType - Type of the new standpoint (defaults to current).
 * @property {boolean} attachAsChildOfNewStandPoint - Also attach this action as a child of the new standpoint.
 */

/**
 * Default descriptor used for any action type that has not been explicitly registered.
 * Represents a plain "child" action: it does not create a new standpoint, and is simply
 * attached to whatever the current standpoint is. This is what makes custom, user-registered
 * action types (e.g. 'openDoor') work out of the box without needing structural configuration.
 *
 * @type {StructureDescriptor}
 * */
const DEFAULT_DESCRIPTOR = Object.freeze({
    createsNewStandPoint: false,
    standOffset: null,
    relativeToLastParent: false,
    standPointType: null,
    attachAsChildOfNewStandPoint: false,
});

/**
 * Registry defining how action types shape the Path tree (creating a parent standpoint or attaching as a child) during Path.add().
 *
 * Distinct from ActionRegistry (which defines execution behaviors). Built-in types are registered
 * automatically; custom actions only need registration if they create new standpoints.
 */
class PathStructureRegistry {
    constructor() {
        /** @type {Map<string, StructureDescriptor>} */
        this._descriptors = new Map();
        this._registerBuiltins();
    }

    /**
     * Registers the structural descriptors for the action types shipped with the library.
     * @private
     * */
    _registerBuiltins() {
        this.register('move', {
            createsNewStandPoint: true,
            standOffset: new Vec3(0, 1, 0),
        });

        this.register('jumpOn', {
            createsNewStandPoint: true,
            standOffset: new Vec3(0, 1, 0),
            standPointType: 'move',
            attachAsChildOfNewStandPoint: true,
        });

        this.register('up', {
            createsNewStandPoint: true,
            standOffset: new Vec3(0, 1, 0),
            relativeToLastParent: true,
            standPointType: 'move',
        });

        this.register('down', {
            createsNewStandPoint: true,
            standOffset: new Vec3(0, -1, 0),
            relativeToLastParent: true,
            standPointType: 'move',
        });

        // 'dig' and 'place' are plain child actions and use DEFAULT_DESCRIPTOR implicitly
    }

    /**
     * Registers or overrides the structural descriptor for an action type.
     *
     * @param {string} type
     * @param {Partial<StructureDescriptor>} descriptor
     * */
    register(type, descriptor) {
        this._descriptors.set(type, { ...DEFAULT_DESCRIPTOR, ...descriptor });
    }

    /**
     * Removes a previously registered structural descriptor, reverting the type to
     * DEFAULT_DESCRIPTOR (plain child) behavior.
     *
     * @param {string} type
     * @returns {boolean} True if a descriptor was registered and has been removed.
     * */
    unregister(type) {
        return this._descriptors.delete(type);
    }

    /**
     * Returns the structural descriptor for a given action type, or DEFAULT_DESCRIPTOR if the
     * type has not been explicitly registered.
     *
     * @param {string} type
     * @returns {StructureDescriptor}
     * */
    get(type) {
        return this._descriptors.get(type) ?? DEFAULT_DESCRIPTOR;
    }

    /**
     * Checks whether the type has an explicitly registered structure descriptor (as opposed to
     * falling back to the default).
     *
     * @param {string} type
     * @returns {boolean}
     * */
    has(type) {
        return this._descriptors.has(type);
    }
}

module.exports = PathStructureRegistry;
