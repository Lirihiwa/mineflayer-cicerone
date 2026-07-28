const ToolSelector = require('../tools/ToolSelector');

/**
 * Handles breaking blocks: equips the most suitable tool available (if any), then digs the
 * block at the target position until it's gone.
 * */
class Digger {
    /**
     * @param {import('mineflayer').Bot} bot
     * @param {import('../settings/CiceroneSettings')} settings
     * */
    constructor(bot, settings) {
        this.bot = bot;
        this.settings = settings;
        this._toolSelector = new ToolSelector(bot);
    }

    /**
     * Breaks the block at the specified coordinates.
     *
     * @param {import('vec3').Vec3} position - Position of the target block.
     * @returns {Promise<void>}
     * */
    async digBlock(position) {
        while (!this.bot.entity.onGround) {
            await this.bot.waitForTicks(1);
        }

        let block = this.bot.blockAt(position);
        if (!block || !block.name || block.name === 'air') return;

        try {
            const tool = this._toolSelector.harvestTool(block);
            if (tool) {
                await this.bot.equip(tool, 'hand');
            }
        } catch (e) {
            console.warn(
                `[Cicerone] Tool selection warning: ${e.message}. Attempting to dig by hand.`,
            );
        }

        while (block.name !== 'air' && block.name !== 'cave_air') {
            try {
                await this.bot.lookAt(block.position.clone().offset(0.5, 0.5, 0.5), true);
                await this.bot.waitForTicks(5);
                await this.bot.dig(block, false, 'raycast');
            } catch (e) {
                console.error(`[Cicerone] Failed to dig block at ${position}:`, e.message);
                break;
            }

            await this.bot.waitForTicks(2);
            block = this.bot.blockAt(position);
        }
    }
}

module.exports = Digger;
