const CiceronePlugin = require('./lib/plugin/CiceronePlugin');
const Path = require('./lib/path/Path');
const { PathElement, ParentPathElement } = require('./lib/path/PathElement');
const ActionRegistry = require('./lib/path/ActionRegistry');
const PathStructureRegistry = require('./lib/path/PathStructureRegistry');
const CiceroneSettings = require('./lib/settings/CiceroneSettings');
const CiceroneError = require('./lib/errors/CiceroneError');

/**
 * Mineflayer plugin entry point.
 *
 * @param {import('mineflayer').Bot} bot
 * @param {ConstructorParameters<typeof CiceroneSettings>[0]} [options] - Initial settings, e.g.
 *  `{ buildingBlocks: ['cobblestone'] }`. Can also be configured later via
 *  `bot.cicerone.settings`.
 * */
function plugin(bot, options) {
    CiceronePlugin.inject(bot, options);
}

// Exposed for consumers who need to construct Paths, register custom action types, or catch
// CiceroneError specifically outside the bot.cicerone.* namespace (e.g. before a bot exists,
// in tests, or when working with multiple bots).
plugin.Path = Path;
plugin.PathElement = PathElement;
plugin.ParentPathElement = ParentPathElement;
plugin.ActionRegistry = ActionRegistry;
plugin.PathStructureRegistry = PathStructureRegistry;
plugin.CiceroneSettings = CiceroneSettings;
plugin.CiceroneError = CiceroneError;

module.exports = plugin;
