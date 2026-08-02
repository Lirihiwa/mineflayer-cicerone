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
     * Finds an adjacent solid block on whose edge a new block can be placed.
     *
     * @param {import('vec3').Vec3} position - The target point where the block should be placed.
     * @returns {{ referenceBlock: ReturnType<import('mineflayer').Bot['blockAt']>, faceVector: import('vec3').Vec3 | null }}
     * @private
     * */
    _getReferenceBlockAndFaceVector(position) {
        const directions = [
            new Vec3(0, -1, 0),
            new Vec3(0, 1, 0),
            new Vec3(-1, 0, 0),
            new Vec3(1, 0, 0),
            new Vec3(0, 0, -1),
            new Vec3(0, 0, 1),
        ];

        for (const dir of directions) {
            const referenceBlockPos = position.plus(dir);
            const block = this.bot.blockAt(referenceBlockPos);

            if (
                block &&
                block.name !== 'air' &&
                block.name !== 'cave_air' &&
                block.name !== 'water' &&
                block.name !== 'lava'
            ) {
                const faceVector = dir.scaled(-1);
                return { referenceBlock: block, faceVector };
            }
        }

        return { referenceBlock: null, faceVector: null };
    }

    /**
     * Finds any solid building block in the bot's inventory (per settings) and equips it.
     *
     * @returns {Promise<import('prismarine-item').Item>}
     * @throws {CiceroneError} If no building blocks are configured, or none are found in
     *  inventory.
     * @private
     * */
    async _equipBuildingBlock() {
        const allowedBlocks = this.settings.requireBuildingBlocks();

        const item = this.bot.inventory.items().find((i) => allowedBlocks.includes(i.name));

        if (!item) {
            throw new CiceroneError(
                'No suitable building blocks found in inventory matching your settings.',
            );
        }

        await this.bot.equip(item, 'hand');
        return item;
    }

    /**
     * Safely places a building block at the specified coordinates.
     *
     * @param {import('vec3').Vec3} position - The target point where the block should be placed.
     * @returns {Promise<void>}
     * @throws {CiceroneError} If no reference block is found to place against.
     * */
    async placeBuildingBlock(position) {
        const { referenceBlock, faceVector } = this._getReferenceBlockAndFaceVector(position);

        if (!referenceBlock || !faceVector) {
            throw new CiceroneError(
                `Reference block not found to place block at position: ${position}`,
            );
        }

        await this._equipBuildingBlock();

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

                await this._equipBuildingBlock();
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
