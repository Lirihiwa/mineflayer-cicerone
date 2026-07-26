/**
 * @param {import('mineflayer').Bot} bot
 * */ const {harvestTool} = require("./utils/inventory");
module.exports = (bot) => {
    /**
     * Breaks the block at the specified coordinates.
     *
     * @param {import('vec3').Vec3} position - Position of the target block.
     * @returns {Promise<void>}
     * */
    bot.cicerone.digBlock = async (position) => {
        while (!bot.entity.onGround) {
            await bot.waitForTicks(1);
        }

        let block = bot.blockAt(position);
        if (!block || !block.name || block.name === 'air') return;

        try {
            const tool = harvestTool(bot, block);
            if (tool) {
                await bot.equip(tool, 'hand');
            }
        } catch (e) {
            console.warn(`[Cicerone] Tool selection warning: ${e.message}. Attempting to dig by hand.`);
        }

        while (block.name !== 'air' && block.name !== 'cave_air') {
            try {
                await bot.lookAt(block.position.clone().offset(0.5, 0.5, 0.5), true);
                await bot.waitForTicks(5);
                await bot.dig(block, false, 'raycast');
            } catch (e) {
                console.error(`[Cicerone] Failed to dig block at ${position}:`, e.message);
                break;
            }

            await bot.waitForTicks(2);
            block = bot.blockAt(position);
        }
    }
}