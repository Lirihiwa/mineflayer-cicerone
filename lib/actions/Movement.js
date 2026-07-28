const CiceroneError = require('../errors/CiceroneError');

/**
 * @typedef {Object} GotoOptions
 * @property {number} [precision] - Hit radius in blocks. Defaults to settings.getMovementPrecision().
 * @property {number} [timeout] - Time to move in ms. Defaults to settings.getMovementTimeoutMs().
 * */

/**
 * Handles the bot's horizontal-plane movement toward a target position, and jumping onto a
 * target block.
 *
 * Movement owns its own in-flight state (whether it's currently moving, the active timeout and
 * tick listener) as instance fields, rather than module-level closure variables — this means a
 * bot can have its own independent Movement instance, and the state is inspectable/testable
 * without needing a real bot.
 * */
class Movement {
    /**
     * @param {import('mineflayer').Bot} bot
     * @param {import('../settings/CiceroneSettings')} settings
     * */
    constructor(bot, settings) {
        this.bot = bot;
        this.settings = settings;

        this._isMoving = false;
        this._moveTimeout = null;
        this._tickListener = null;
        this._activeResolve = null;
        this._activeReject = null;
    }

    /**
     * @returns {boolean} Whether the bot is currently mid-movement.
     * */
    get isMoving() {
        return this._isMoving;
    }

    /**
     * Internal method for fully stopping movement and cleaning up resources.
     *
     * @param {Error|null} [err] - If provided, the in-flight promise is rejected with it.
     *  Otherwise it's resolved.
     * @private
     * */
    _stop(err = null) {
        if (!this._isMoving) return;

        this._isMoving = false;
        this.bot.clearControlStates();

        if (this._moveTimeout) {
            clearTimeout(this._moveTimeout);
            this._moveTimeout = null;
        }

        if (this._tickListener) {
            this.bot.removeListener('physicsTick', this._tickListener);
            this._tickListener = null;
        }

        const resolve = this._activeResolve;
        const reject = this._activeReject;
        this._activeResolve = null;
        this._activeReject = null;

        if (err) {
            if (reject) reject(err);
        } else {
            if (resolve) resolve();
        }
    }

    /**
     * Moves the bot to the specified point.
     *
     * @param {import('vec3').Vec3} vec - Coordinates of the target point.
     * @param {GotoOptions} [options] - Movement settings.
     * @returns {Promise<void>} Resolved on successful arrival, rejected on error/timeout/abortion.
     * */
    goto(vec, options = {}) {
        const precision = options.precision ?? this.settings.getMovementPrecision();
        const timeoutMs = options.timeout ?? this.settings.getMovementTimeoutMs();

        if (this._isMoving) {
            this._stop(new CiceroneError('Movement interrupted by a new goto call.'));
        }

        this._isMoving = true;

        // Offset target to block center.
        const targetX = vec.x + 0.5;
        const targetZ = vec.z + 0.5;

        return new Promise((resolve, reject) => {
            this._activeResolve = resolve;
            this._activeReject = reject;

            let lastDistance = Infinity;

            this._moveTimeout = setTimeout(() => {
                this._stop(new CiceroneError(`Movement timeout at position: ${vec}`));
            }, timeoutMs);

            this._tickListener = () => {
                if (!this.bot.entity) return;

                const pos = this.bot.entity.position;
                const dx = targetX - pos.x;
                const dy = vec.y - pos.y;
                const dz = targetZ - pos.z;
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

                // Successful arrival.
                if (distance <= precision) {
                    this._stop();
                    return;
                }

                // Started overshooting/oscillating close to the target — stop rather than
                // fight it forever.
                if (distance > lastDistance + 0.05 && distance < 0.8) {
                    this._stop();
                    return;
                }

                lastDistance = distance;

                const targetYaw = Math.atan2(-dx, -dz);

                // Normalize angle difference to [-PI, PI].
                let diffYaw = (targetYaw - this.bot.entity.yaw) % (Math.PI * 2);
                if (diffYaw > Math.PI) diffYaw -= Math.PI * 2;
                if (diffYaw < -Math.PI) diffYaw += Math.PI * 2;

                this.bot.look(targetYaw, this.bot.entity.pitch, true).catch(() => {});

                // Only walk forward once roughly facing the target (~2.86 degree margin).
                this.bot.setControlState('forward', Math.abs(diffYaw) < 0.05);

                // Slow down (sneak) when very close, to avoid overshooting.
                this.bot.setControlState('sneak', distance < 0.4 && this.bot.entity.onGround);
            };

            this.bot.on('physicsTick', this._tickListener);
        });
    }

    /**
     * Forces the bot to jump onto the specified block.
     *
     * @param {import('vec3').Vec3} vec - Position of the block the bot should land on top of.
     * @param {GotoOptions} [options] - Passed through to the confirming goto() call.
     * @returns {Promise<void>} Resolved once the bot is standing on top of the block.
     * */
    async jumpOn(vec, options = {}) {
        while (!this.bot.entity.onGround) {
            await this.bot.waitForTicks(2);
        }

        await this.bot.lookAt(vec.offset(0.5, 0.5, 0.5));
        this.bot.setControlState('jump', true);

        while (vec.y - this.bot.entity.position.y < 0.3) {
            await this.bot.waitForTicks(1);
        }

        this.bot.setControlState('jump', false);
        await this.goto(vec, options);
    }

    /**
     * Forcefully stops the bot's current movement, if any.
     * */
    stop() {
        if (this._isMoving) {
            this._stop(new CiceroneError('Movement was forcefully interrupted.'));
        }
    }
}

module.exports = Movement;
