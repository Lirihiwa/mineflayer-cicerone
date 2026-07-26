/**
 * Converts an item's enchantments into "name:level" format.
 *
 * @param {import('prismarine-item').Item | null} item - Item to be checked.
 * @returns {Object<string, number>} Enchantment List.
 * */
function getEnchantments(item) {
    const enchants = {};

    if (!item) return enchants;

    if (item.enchants && Array.isArray(item.enchants)) {
        for (const enchant of item.enchants) {
            enchants[enchant.name] = enchant.lvl;
        }
    }

    return enchants;
}

/**
 * Calculates the remaining durability of the item.
 *
 * @param {import('prismarine-item').Item | null} item - Item to be checked.
 * @returns {number} Remaining amount of durability units.
 * */
function getDurability(item) {
    if (!item) return 0;
    const max = item.maxDurability;
    if (!max) return 100;

    const used = item.durabilityUsed || 0;
    return max - used;
}

module.exports = {
    getEnchantments,
    getDurability,
}