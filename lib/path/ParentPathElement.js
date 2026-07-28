const PathElement = require('./PathElement');

/**
 * A PathElement that additionally represents a "standpoint" — a position the bot physically stands
 * at — and can carry a list of child PathElements representing actions performed at that standpoint before
 * the bot moves on (e.g. digging, placing blocks, jumping, etc.). Whether a given action type produces a
 * ParentPathElement for a plain PathElement is decided by PathStructureRegistry, not by this class — ParentPathElement
 * only knows how to store and traverse children once it exists.
 * */
class ParentPathElement extends PathElement {
    /**
     * @param {import('vec3').Vec3} position
     * @param {string} type
     * */
    constructor(position, type) {
        super(position, type);

        /** @type {PathElement[]} */
        this.children = [];
    }

    /**
     * Appends a child element to this standpoint.
     *
     * @param {PathElement} child
     * */
    addChild(child) {
        this.children.push(child);
    }

    /**
     * @returns {boolean} True if this standpoint still has unprocessed children.
     * */
    hasChildren() {
        return this.children.length > 0;
    }
}

module.exports = ParentPathElement;
