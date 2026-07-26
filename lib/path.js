const vec3 = require('vec3');
const { PathElement, ParentPathElement } = require('./pathElement');

class Path {
    constructor() {
        this.pathElements = [];
        this.lastParentElement = null;
    }

    /**
     * Adds a new element to the path.
     *
     * @param {import('vec3').Vec3} position
     * @param {string} type
     */
    add(position, type) {
        if (this.pathElements.length === 0 || type === 'move') {
            const parent = new ParentPathElement(position, type);
            this.pathElements.push(parent);
            this.lastParentElement = parent;
        } else if (this.lastParentElement) {
            const child = new PathElement(position, type);
            this.lastParentElement.addChild(child);
        }
    }

    /**
     * Clear path.
     * */
    reset() {
        this.pathElements = [];
        this.lastParentElement = null;
    }

    /**
     * Performs the route.
     *
     * @param {import('mineflayer').Bot} bot
     */
    async resolve(bot) {
        while (this.pathElements.length > 0) {
            const currentParent = this.pathElements.shift();
            await currentParent.resolve(bot);

            while (currentParent.hasChildren()) {
                const child = currentParent.children.shift();
                await child.resolve(bot);
            }
        }
    }

    /**
     * Performs the return route.
     *
     * @param {import('mineflayer').Bot} bot
     */
    async revert(bot) {
        while (this.pathElements.length > 0) {
            const currentParent = this.pathElements.pop();
            await currentParent.revert(bot);

            while (currentParent.hasChildren()) {
                const child = currentParent.children.pop();
                await child.revert(bot);
            }
        }
    }

    toJSON() {
        return this.pathElements;
    }

    /**
     * Reconstructs the path from JSON format.
     *
     * @param {Array|string} json
     * @returns {Path}
     */
    static fromJSON(json) {
        const rawElements = typeof json === 'string' ? JSON.parse(json) : json;
        const pathInstance = new Path();

        pathInstance.pathElements = rawElements.map(parentRaw => {
            const parentPos = new vec3(parentRaw.position.x, parentRaw.position.y, parentRaw.position.z);
            const parent = new ParentPathElement(parentPos, parentRaw.type);

            if (parentRaw.children && Array.isArray(parentRaw.children)) {
                parentRaw.children.forEach(childRaw => {
                    const childPos = new vec3(childRaw.position.x, childRaw.position.y, childRaw.position.z);
                    const child = new PathElement(childPos, childRaw.type);
                    parent.addChild(child);
                });
            }
            return parent;
        });

        pathInstance.lastParentElement = pathInstance.pathElements[pathInstance.pathElements.length - 1] || null;

        return pathInstance;
    }
}

module.exports = Path;