const { Vec3 } = require('vec3');
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
            const standPosition = position.clone().offset(0, 1, 0);
            const parent = new ParentPathElement(standPosition, type);
            this.pathElements.push(parent);
            this.lastParentElement = parent;
            return;
        }

        if (type === 'jumpOn') {
            const standPosition = position.clone().offset(0, 1, 0);
            const parent = new ParentPathElement(standPosition, 'move');
            this.pathElements.push(parent);

            this.lastParentElement = parent;
            this.lastParentElement.addChild(new PathElement(standPosition, type));
            return;
        }

        if (type === 'up' || type === 'down') {
            const dy = type === 'up' ? 1 : -1;
            const standPosition = this.lastParentElement.position.clone().offset(0, dy, 0);

            const parent = new ParentPathElement(standPosition, 'move');
            this.pathElements.push(parent);
            this.lastParentElement = parent;
        }

        if (this.lastParentElement) {
            this.lastParentElement.addChild(new PathElement(position, type));
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
     * Clone path.
     * */
    clone() {
        const pathElements = [];

        for (const pathElement of this.pathElements) {
            const parent = new ParentPathElement(pathElement.position, pathElement.type);
            pathElements.push(parent);

            for (const child of pathElement.children) {
                parent.addChild(new PathElement(child.position, child.type));
            }
        }

        return pathElements;
    }

    /**
     * Performs the route.
     *
     * @param {import('mineflayer').Bot} bot
     */
    async resolve(bot) {
        const bufferedPath = this.clone();

        while (bufferedPath.length > 0) {
            const currentParent = bufferedPath.shift();

            while (currentParent.hasChildren()) {
                const child = currentParent.children.shift();
                await child.resolve(bot);
            }

            await currentParent.resolve(bot);
        }
    }

    /**
     * Performs the return route.
     *
     * @param {import('mineflayer').Bot} bot
     */
    async revert(bot) {
        const bufferedPath = this.clone();

        while (bufferedPath.length > 0) {
            const currentParent = bufferedPath.pop();
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

        pathInstance.pathElements = rawElements.map((parentRaw) => {
            const parentPos = new Vec3(
                parentRaw.position.x,
                parentRaw.position.y,
                parentRaw.position.z,
            );
            const parent = new ParentPathElement(parentPos, parentRaw.type);

            if (parentRaw.children && Array.isArray(parentRaw.children)) {
                parentRaw.children.forEach((childRaw) => {
                    const childPos = new Vec3(
                        childRaw.position.x,
                        childRaw.position.y,
                        childRaw.position.z,
                    );
                    const child = new PathElement(childPos, childRaw.type);
                    parent.addChild(child);
                });
            }
            return parent;
        });

        pathInstance.lastParentElement =
            pathInstance.pathElements[pathInstance.pathElements.length - 1] || null;

        return pathInstance;
    }
}

module.exports = Path;
