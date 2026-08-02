const { Vec3 } = require('vec3');
const CiceroneError = require('../errors/CiceroneError');

/**
 * Utils for Placement.js
 */
class PlacementUtils {
    /**
     * Finds an adjacent solid block on whose edge a new block can be placed.
     *
     * @param {import('mineflayer').Bot} bot
     * @param {import('vec3')} position
     * @returns {{referenceBlock: import('prismarine-block').Block | null, faceVector: import('vec3').Vec3}}
     */
    static getReferenceBlockAndFaceVector(bot, position) {
        const directions = [
            new Vec3(0, -1, 0),
            new Vec3(0, 1, 0),
            new Vec3(-1, 0, 0),
            new Vec3(1, 0, 0),
            new Vec3(0, 0, -1),
            new Vec3(0, 0, 1),
        ];

        for (const dir of directions) {
            const referenceBlockPos = position.plus(dir);
            const block = bot.blockAt(referenceBlockPos);

            if (
                block &&
                block.name !== 'air' &&
                block.name !== 'cave_air' &&
                block.name !== 'water' &&
                block.name !== 'lava'
            ) {
                const faceVector = dir.scaled(-1);
                return { referenceBlock: block, faceVector };
            }
        }

        return { referenceBlock: null, faceVector: null };
    }

    /**
     * Finds any solid building block in the bot's inventory (per settings) and equips it.
     *
     * @returns {Promise<import('prismarine-item').Item>}
     * @throws {CiceroneError} If no building blocks are configured, or none are found in
     *  inventory.
     * @private
     * */
    static async equipBuildingBlock(bot, settings) {
        const allowedBlocks = settings.requireBuildingBlocks();

        const item = bot.inventory.items().find((i) => allowedBlocks.includes(i.name));

        if (!item) {
            throw new CiceroneError(
                'No suitable building blocks found in inventory matching your settings.',
            );
        }

        await bot.equip(item, 'hand');
        return item;
    }
}

module.exports = PlacementUtils;
