const { Vec3 } = require('vec3');

/**
 * Finds an adjacent solid block on whose edge a new block can be placed.
 *
 * @param {import('mineflayer').Bot} bot
 * @param {import('vec3').Vec3} position - The target point where the block should be placed.
 * @returns {{ referenceBlock: ReturnType<import('mineflayer').Bot['blockAt']>, faceVector: import('vec3').Vec3 | null }}
 * */
function getReferenceBlockAndFaceVector(bot, position) {
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
 * Finds any solid building block in the bot's inventory and equips it.
 *
 * @param {import('mineflayer').Bot} bot
 * @returns {Promise<import('prismarine-item').Item>}
 */
async function equipBuildingBlock(bot) {
    const allowedBlocks = bot.cicerone?.settings?.buildingBlocks || [];

    if (allowedBlocks.length === 0) {
        throw new Error(
            '[Cicerone] No building blocks configured in bot.cicerone.settings.buildingBlocks',
        );
    }

    const item = bot.inventory.items().find((i) => allowedBlocks.includes(i.name));

    if (!item) {
        throw new Error(
            '[Cicerone] No suitable building blocks found in inventory matching your settings.',
        );
    }

    await bot.equip(item, 'hand');
    return item;
}

/**
 * @param {import('mineflayer').Bot} bot
 */
module.exports = (bot) => {
    /**
     * Safely places a building block at the specified coordinates.
     *
     * @param {import('vec3').Vec3} position - The target point where the block should be placed
     * @returns {Promise<void>}
     */
    bot.cicerone.placeBuildingBlock = async (position) => {
        const { referenceBlock, faceVector } = getReferenceBlockAndFaceVector(bot, position);

        if (!referenceBlock || !faceVector) {
            throw new Error(
                `[Cicerone] Reference block not found to place block at position: ${position}`,
            );
        }

        await equipBuildingBlock(bot);

        const lookTarget = referenceBlock.position.clone().offset(0.5, 0.5, 0.5);
        await bot.lookAt(lookTarget, true);
        await bot.placeBlock(referenceBlock, faceVector);
    };

    /**
     * Causes the bot to jump and place a building block underneath itself.
     *
     * @returns {Promise<void>}
     */
    bot.cicerone.buildUp = async () => {
        bot.clearControlStates();

        while (!bot.entity.onGround) {
            await bot.waitForTicks(1);
        }

        const initialPosition = bot.entity.position.clone();
        const targetBlockPosition = initialPosition.floored();

        await equipBuildingBlock(bot);
        await bot.waitForTicks(1);

        bot.setControlState('jump', true);

        return new Promise((resolve, reject) => {
            const yPosListener = async () => {
                if (!bot.entity) {
                    bot.removeListener('physicsTick', yPosListener);
                    reject(new Error('Bot disconnected during buildup.'));
                    return;
                }

                if (bot.entity.position.y >= initialPosition.y + 1.1) {
                    bot.removeListener('physicsTick', yPosListener);
                    bot.setControlState('jump', false);

                    try {
                        await bot.cicerone.placeBuildingBlock(targetBlockPosition);
                        resolve();
                    } catch (err) {
                        reject(err);
                    } finally {
                        bot.clearControlStates();
                    }
                }
            };

            bot.on('physicsTick', yPosListener);
        });
    };
};
