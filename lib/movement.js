/**
 * @typedef {Object} GotoOptions
 * @property {number} [precision=0.15] - Hit radius in blocks.
 * @property {number} [timeout=30_000] - Time to move in ms.
 * */

/**
 * @param {import('mineflayer').Bot} bot
 * */
module.exports = (bot) => {
    const DEFAULT_TIMEOUT_MS = 30_000;

    let isMoving = false;
    let moveTimeout = null;
    let tickListener = null;

    let activeResolve = null;
    let activeReject = null;

    /**
     * Internal method for completely stopping movement and cleaning up resources.
     * @param {Error|null} [err] - If passed, the promise will complete with an error (rejection).
     *  */
    const stopMovement = (err = null) => {
        if (!isMoving) return;

        isMoving = false;
        bot.clearControlStates();

        if (moveTimeout) {
            clearTimeout(moveTimeout);
            moveTimeout = null;
        }

        if (tickListener) {
            bot.removeListener('physicsTick', tickListener);
            tickListener = null;
        }

        const resolve = activeResolve;
        const reject = activeReject;

        activeResolve = null;
        activeReject = null;

        if (err) {
            if (reject) reject(err);
        } else {
            if (resolve) resolve();
        }
    };

    /**
     * Moves the bot to the specified point along the horizontal plane (X, Z).
     *
     * @param {import('vec3').Vec3} vec - Coordinates of the target point.
     * @param {GotoOptions} [options] - Movement settings.
     * @returns {Promise<void>} - Allowed on successful arrival, rejected on error/timeout/abortion.
     * */
    bot.cicerone.goto = async (vec, options = {}) => {
        const precision = options.precision ?? 0.15;
        const timeoutMs = options.timeout ?? DEFAULT_TIMEOUT_MS;

        if (isMoving) {
            stopMovement(new Error('Movement interrupted by a new goto call.'));
        }

        isMoving = true;

        // Offset target to block center.
        const targetX = vec.x + 0.5;
        const targetZ = vec.z + 0.5;

        return new Promise((resolve, reject) => {
            activeResolve = resolve;
            activeReject = reject;

            let lastDistance = Infinity;

            moveTimeout = setTimeout(() => {
                stopMovement(new Error(`Movement timeout at position: ${vec}`));
            }, timeoutMs);

            tickListener = () => {
                if (!bot.entity) return;

                const pos = bot.entity.position;
                const dx = targetX - pos.x;
                const dz = targetZ - pos.z;
                const distance = Math.sqrt(dx * dx + dz * dz);

                // Successful arrival
                if (distance <= precision) {
                    stopMovement();
                    return;
                }

                if (distance > lastDistance + 0.05 && distance < 0.8) {
                    stopMovement();
                    return;
                }

                lastDistance = distance;

                const targetYaw = Math.atan2(-dx, -dz);

                // Normalization of angle differences to the range [-PI, PI]
                let diffYaw = (targetYaw - bot.entity.yaw) % (Math.PI * 2);
                if (diffYaw > Math.PI) diffYaw -= Math.PI * 2;
                if (diffYaw < -Math.PI) diffYaw += Math.PI * 2;

                bot.look(targetYaw, bot.entity.pitch, true).catch(() => {});

                // Starts walking forward only if the bot is looking roughly in the direction of the target.
                // Margin of error ~2.86 degrees.
                if (Math.abs(diffYaw) < 0.05) {
                    bot.setControlState('forward', true);
                } else {
                    bot.setControlState('forward', false);
                }

                // It slows down (sneak) when getting very close, to avoid overshooting the point.
                if (distance < 0.6) {
                    bot.setControlState('sneak', true);
                } else {
                    bot.setControlState('sneak', false);
                }
            };

            bot.on('physicsTick', tickListener);
        });
    };

    /**
     * Forcefully stops the bot's current movement.
     * */
    bot.cicerone.stopMove = () => {
        if (isMoving) {
            stopMovement(new Error('Movement was forcefully interrupted.'));
        }
    };
};
