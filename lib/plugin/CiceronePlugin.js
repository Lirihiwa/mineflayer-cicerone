const CiceroneSettings = require('../settings/CiceroneSettings');
const ActionRegistry = require('../path/ActionRegistry');
const Path = require('../path/Path');

const Movement = require('../actions/Movement');
const Digging = require('../actions/Digging');
const Placement = require('../actions/Placement');
const CiceroneError = require('../errors/CiceroneError');

/**
 * Wires up all Cicerone components for a given bot and exposes the public bot.cicerone API.
 *
 * This is the single composition point of the library: it is the only place that knows about
 * every class at once. Everything else (Movement, Digger, Placer, Path, the registries) is
 * decoupled from the others and only knows what it's explicitly given.
 * */
class CiceronePlugin {
    /**
     * @param {import('mineflayer').Bot} bot
     * @param {ConstructorParameters<typeof CiceroneSettings>[0]} [options]
     * */
    static inject(bot, options = {}) {
        if (bot.cicerone) return;

        const settings = new CiceroneSettings(options);

        const movement = new Movement(bot, settings);
        const digger = new Digging(bot, settings);
        const placer = new Placement(bot, settings);

        const actionRegistry = new ActionRegistry();

        CiceronePlugin._registerBuiltinActions(actionRegistry, { movement, digger, placer });

        bot.cicerone = {
            settings,
            actionRegistry,

            /**
             * Creates a new Path rooted at the bot's current position.
             *
             * @returns {Path}
             * */
            createPath: () => new Path(actionRegistry),

            /**
             * @param {Path} path
             * @returns {Promise<void>}
             * */
            run: (path) => path.run(),

            /**
             * @param {Path} path
             * @returns {Promise<void>}
             * */
            reverse: (path) => path.reverse(),

            /**
             * Reconstructs a Path previously serialized via path.toJSON(), wiring it back up to
             * this bot's registries.
             *
             * @param {Array|string} json
             * @returns {Path}
             * */
            pathFromJSON: (json) => Path.fromJSON(json, actionRegistry),

            actions: {
                goto: (vec, opts) => movement.goto(vec, opts),
                jumpOn: (vec, opts) => movement.jumpOn(vec, opts),
                stopMove: () => movement.stop(),
                digBlock: (pos) => digger.digBlock(pos),
                placeBuildingBlock: (pos) => placer.placeBuildingBlock(pos),
                buildUp: () => placer.buildUp(),
            },
        };
    }

    /**
     * Registers resolve/revert handlers for the library's built-in action types.
     *
     * @param {ActionRegistry} actionRegistry
     * @param {{ movement: Movement, digger: Digging, placer: Placement }} handlers
     * @private
     * */
    static _registerBuiltinActions(actionRegistry, { movement, digger, placer }) {
        actionRegistry.register(
            'move',
            (pos) => movement.goto(pos),
            (pos) => movement.goto(pos),
        );

        actionRegistry.register(
            'dig',
            (pos) => digger.digBlock(pos),
            (pos) => placer.placeBuildingBlock(pos),
        );

        actionRegistry.register(
            'place',
            (pos) => placer.placeBuildingBlock(pos),
            (pos) => digger.digBlock(pos),
        );

        actionRegistry.register(
            'up',
            () => placer.buildUp(),
            () => digger.digDown(),
        );

        actionRegistry.register(
            'down',
            () => digger.digDown(),
            () => placer.buildUp(),
        );

        actionRegistry.register(
            'jumpOn',
            async (pos, element) => {
                element.state = {
                    startPosition: movement.bot.entity.position.floored(),
                };

                await movement.jumpOn(pos);
            },
            async (pos, element) => {
                if (!element.state?.startPosition) {
                    throw new CiceroneError(
                        'Start position not defined for jumpOn. Reverse canceled.',
                    );
                }

                const { Vec3 } = require('vec3');
                let startPos = element.state.startPosition;

                if (!(startPos instanceof Vec3)) {
                    startPos = new Vec3(startPos.x, startPos.y, startPos.z);
                }

                await movement.goto(startPos);
            },
        );
    }
}

module.exports = CiceronePlugin;
