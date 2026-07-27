const Path = require('./lib/path');
const { PathElement, ParentPathElement } = require('./lib/pathElement');
const injectMovement = require('./lib/movement');
const injectDigging = require('./lib/digging');
const injectPlacement = require('./lib/placement');

/**
 * @param {import('mineflayer').Bot} bot
 */
function plugin(bot) {
    if (!bot.cicerone) {
        bot.cicerone = {};
        bot.cicerone.settings = {};
    }

    injectMovement(bot);
    injectDigging(bot);
    injectPlacement(bot);
}

plugin.Path = Path;
plugin.PathElement = PathElement;
plugin.ParentPathElement = ParentPathElement;

module.exports = plugin;
