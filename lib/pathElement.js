const elementType = Object.freeze({
    move: 'move',
    dig: 'dig',
    place: 'place',
    down: 'down',
    up: 'up',
    jumpOn: 'jumpOn',
});

const resolveMap = Object.freeze({
    [elementType.move]: async (bot, position) => {
        await bot.cicerone.goto(position);
    },
    [elementType.dig]: async (bot, position) => {
        await bot.cicerone.digBlock(position);
    },
    [elementType.place]: async (bot, position) => {
        await bot.cicerone.placeBuildingBlock(position);
    },
    [elementType.down]: async (bot, position) => {
        await bot.cicerone.digBlock(position);
    },
    [elementType.up]: async (bot, _) => {
        await bot.cicerone.buildUp();
    },
    [elementType.jumpOn]: async (bot, position) => {
        await bot.cicerone.jumpOn(position);
    },
});

const revertMap = Object.freeze({
    [elementType.move]: async (bot, position) => {
        await bot.cicerone.goto(position);
    },
    [elementType.dig]: async (bot, position) => {
        await bot.cicerone.placeBuildingBlock(position);
    },
    [elementType.place]: async (bot, position) => {
        await bot.cicerone.digBlock(position);
    },
    [elementType.down]: async (bot, _) => {
        await bot.cicerone.buildUp();
    },
    [elementType.up]: async (bot, position) => {
        await bot.cicerone.digBlock(position);
    },
    [elementType.jumpOn]: async () => {
        return;
    },
});

class PathElement {
    /**
     * @param {import('vec3').Vec3} position
     * @param {keyof typeof elementType} type
     */
    constructor(position, type) {
        this.position = position;
        this.type = type;
    }

    getInfo() {
        return `Type: ${this.type}, Position: ${this.position}`;
    }

    async resolve(bot) {
        const handler = resolveMap[this.type];
        if (handler) {
            try {
                await handler(bot, this.position);
            } catch (e) {
                throw new Error(`[Cicerone] Unable to resolve [${this.getInfo()}]: ${e.message}`, {
                    cause: e,
                });
            }
        } else {
            throw new Error(`[Cicerone] Unhandled resolve for type: ${this.type}`);
        }
    }

    async revert(bot) {
        const handler = revertMap[this.type];
        if (handler) {
            try {
                await handler(bot, this.position);
            } catch (e) {
                throw new Error(`[Cicerone] Unable to revert [${this.getInfo()}]: ${e.message}`, {
                    cause: e,
                });
            }
        } else {
            throw new Error(`[Cicerone] Unhandled revert for type: ${this.type}`);
        }
    }
}

class ParentPathElement extends PathElement {
    /**
     * @param {import('vec3').Vec3} position
     * @param {keyof typeof elementType} type
     */
    constructor(position, type) {
        super(position, type);
        this.children = [];
    }

    /**
     * @param {PathElement} child
     */
    addChild(child) {
        this.children.push(child);
    }

    hasChildren() {
        return this.children.length > 0;
    }
}

module.exports = {
    elementType,
    PathElement,
    ParentPathElement,
};
