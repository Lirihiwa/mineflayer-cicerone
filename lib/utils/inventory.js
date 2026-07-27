const { getEnchantments, getDurability } = require('./item');

/**
 * Finds the most suitable tool for mining the specified block in the bot's inventory.
 *
 * @param {import('mineflayer').Bot} bot - An instance of the mineflayer bot.
 * @param {import('prismarine-block').Block} block - Target block.
 * @returns {import('prismarine-item').Item | null} The optimal tool, or null if the tool is not required.
 * @throws {Error} If a block requires a tool, but there is no suitable one in the inventory.
 * */
function harvestTool(bot, block) {
    const MIN_DURABILITY = 5;

    if (!block.material) {
        return null;
    }

    const materialParts = block.material.split('/');
    const toolName = materialParts[1];

    if (!toolName) {
        return null;
    }

    let isOre = block.name.includes('_ore');

    const tools = bot.inventory.items().filter((item) => {
        if (!item.name.includes(toolName)) return false;

        if (item.maxDurability) {
            const remainingDurability = getDurability(item);

            if (remainingDurability <= MIN_DURABILITY) {
                return false;
            }
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

    if (!tool) {
        tool = tools[0];
    }

    return tool;
}

module.exports = {
    harvestTool,
};
