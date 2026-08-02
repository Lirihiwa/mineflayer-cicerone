const { Vec3 } = require('vec3');
const CiceroneError = require('../errors/CiceroneError');

/**
 * Handles placing building blocks: finding a solid adjacent block to place against, equipping a
 * suitable block from inventory, and the jump-and-place "build up" maneuver.
 * */
class Placement {
    /**
     * @param {import('mineflayer').Bot} bot
     * @param {import('../settings/CiceroneSettings')} settings
     * */
    constructor(bot, settings) {
        this.bot = bot;
        this.settings = settings;
    }

    /**
     * Safely places a building block at the specified coordinates.
     *
     * @param {import('vec3').Vec3} position - The target point where the block should be placed.
     * @returns {Promise<void>}
     * @throws {CiceroneError} If no reference block is found to place against.
     * */
    async placeBuildingBlock(position) {
        const { referenceBlock, faceVector } = this.settings.utils.getReferenceBlockAndFaceVector(
            this.bot,
            position,
        );

        if (!referenceBlock || !faceVector) {
            throw new CiceroneError(
                `Reference block not found to place block at position: ${position}`,
            );
        }

        await this.settings.utils.equipBuildingBlock(this.bot, this.settings);

        const lookTarget = referenceBlock.position.clone().offset(0.5, 0.5, 0.5);
        await this.bot.lookAt(lookTarget, true);
        await this.bot.placeBlock(referenceBlock, faceVector);
    }

    /**
     * Causes the bot to jump and place a building block underneath itself.
     *
     * @returns {Promise<void>}
     * */
    buildUp() {
        this.bot.clearControlStates();

        return new Promise((resolve, reject) => {
            (async () => {
                while (!this.bot.entity.onGround) {
                    await this.bot.waitForTicks(1);
                }

                const initialPosition = this.bot.entity.position.clone();
                const targetBlockPosition = initialPosition.floored();

                await this.settings.utils.equipBuildingBlock(this.bot, this.settings);
                await this.bot.waitForTicks(1);

                this.bot.setControlState('jump', true);

                const threshold = this.settings.getBuildUpThreshold();

                const yPosListener = async () => {
                    if (!this.bot.entity) {
                        this.bot.removeListener('physicsTick', yPosListener);
                        reject(new CiceroneError('Bot disconnected during buildup.'));
                        return;
                    }

                    if (this.bot.entity.position.y >= initialPosition.y + threshold) {
                        this.bot.removeListener('physicsTick', yPosListener);
                        this.bot.setControlState('jump', false);

                        try {
                            await this.placeBuildingBlock(targetBlockPosition);
                            resolve();
                        } catch (err) {
                            reject(err);
                        } finally {
                            this.bot.clearControlStates();
                        }
                    }
                };

                this.bot.on('physicsTick', yPosListener);
            })().catch(reject);
        });
    }
}

module.exports = Placement;
