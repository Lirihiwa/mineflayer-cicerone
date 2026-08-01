const CiceroneError = require('../errors/CiceroneError');

/**
 * Utils for Digging.js
 */
class ToolUtils {
    /**
     * Finds the most suitable tool for mining the specified block in the bot's inventory.
     * @param {import('mineflayer').Bot} bot
     * @param {import('prismarine-block').Block} block - Target block.
     * @param {import('../settings/CiceroneSettings')} settings - Plugin configuration.
     * @returns {import('prismarine-item').Item | null} The optimal tool, or null if no tool is
     *  required.
     * @throws {CiceroneError} If the block requires a tool, but none suitable is found in the inventory.
     * */
    static harvestTool(bot, block, settings) {
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
                const remainingDurability = this.getDurability(item);
                if (remainingDurability <= settings.getMinDurability()) return false;
            }

            return true;
        });

        if (tools.length === 0) {
            throw new CiceroneError(`Could not find matching tool of type: ${toolName}`);
        }

        let tool;
        if (isOre) {
            tool = tools.find((item) => this.getEnchantments(item).silk_touch);
        } else {
            tool = tools.find((item) => this.getEnchantments(item).fortune);
        }

        return tool ?? tools[0];
    }

    /**
     * Calculates the remaining durability of the item.
     *
     * @param {import('prismarine-item').Item | null} item - Item to be checked.
     * @returns {number} Remaining amount of durability units.
     * */
    static getDurability(item) {
        if (!item) return 0;
        const max = item.maxDurability;
        if (!max) return 100;

        const used = item.durabilityUsed || 0;
        return max - used;
    }

    /**
     * Converts an item's enchantments into "name:level" format.
     *
     * @param {import('prismarine-item').Item | null} item - Item to be checked.
     * @returns {Object<string, number>} Enchantment list.
     * */
    static getEnchantments(item) {
        const enchants = {};

        if (!item) return enchants;

        if (item.enchants && Array.isArray(item.enchants)) {
            for (const enchant of item.enchants) {
                enchants[enchant.name] = enchant.lvl;
            }
        }

        return enchants;
    }
}

module.exports = ToolUtils;
