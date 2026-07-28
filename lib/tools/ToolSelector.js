const { getEnchantments, getDurability } = require('../utils/item');

const MIN_DURABILITY = 5;

/**
 * Selects the most suitable tool in the bot's inventory for harvesting a given block, preferring
 * silk touch for ores and fortune otherwise, and skipping tools that are nearly broken.
 * */
class ToolSelector {
    /**
     * @param {import('mineflayer').Bot} bot
     * */
    constructor(bot) {
        this.bot = bot;
    }

    /**
     * Finds the most suitable tool for mining the specified block in the bot's inventory.
     *
     * @param {import('prismarine-block').Block} block - Target block.
     * @returns {import('prismarine-item').Item | null} The optimal tool, or null if no tool is
     *  required.
     * @throws {Error} If the block requires a tool, but none suitable is found in the inventory.
     * */
    harvestTool(block) {
        if (!block.material) {
            return null;
        }

        const materialParts = block.material.split('/');
        const toolName = materialParts[1];

        if (!toolName) {
            return null;
        }

        const isOre = block.name.includes('_ore');

        const tools = this.bot.inventory.items().filter((item) => {
            if (!item.name.includes(toolName)) return false;

            if (item.maxDurability) {
                const remainingDurability = getDurability(item);
                if (remainingDurability <= MIN_DURABILITY) return false;
            }

            return true;
        });

        if (tools.length === 0) {
            throw new Error(`Could not find matching tool of type: ${toolName}`);
        }

        let tool;
        if (isOre) {
            tool = tools.find((item) => getEnchantments(item).silk_touch);
        } else {
            tool = tools.find((item) => getEnchantments(item).fortune);
        }

        return tool ?? tools[0];
    }
}

module.exports = ToolSelector;
