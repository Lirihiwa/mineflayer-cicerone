const CiceroneError = require('../errors/CiceroneError');

const DEFAULT_MOVEMENT_TIMEOUT_MS = 30_000;
const DEFAULT_MOVEMENT_PRECISION = 0.15;
const DEFAULT_BUILD_UP_THRESHOLD = 1.1;

/**
 * Holds Cicerone's configuration: allowed building blocks and tunable movement/build-up
 * parameters that were previously hardcoded magic numbers scattered across lib/movement.js and
 * lib/placement.js.
 *
 * Fields are exposed only through getters/setters, not as raw public properties — this keeps
 * validation and any future derived logic (e.g. normalization) in one place, rather than
 * requiring every call site that reads a setting to duplicate checks.
 * */
class CiceroneSettings {
    /**
     * @param {Object} [options]
     * @param {string[]} [options.buildingBlocks] - Item names the bot is allowed to use for
     *  building/placing. Defaults to an empty array (no building blocks configured).
     * @param {number} [options.movementTimeoutMs] - Max time in ms a single goto() call is
     *  allowed to take before it's considered failed. Defaults to 30_000.
     * @param {number} [options.movementPrecision] - Hit radius in blocks for goto() to consider
     *  the target reached. Defaults to 0.15.
     * @param {number} [options.buildUpThreshold] - How far (in blocks, on the Y axis) the bot
     *  must have risen during buildUp() before it places the block underneath itself. Defaults
     *  to 1.1.
     * @throws {CiceroneError} If any provided option fails validation.
     * */
    constructor({
        buildingBlocks = [],
        movementTimeoutMs = DEFAULT_MOVEMENT_TIMEOUT_MS,
        movementPrecision = DEFAULT_MOVEMENT_PRECISION,
        buildUpThreshold = DEFAULT_BUILD_UP_THRESHOLD,
    } = {}) {
        this._buildingBlocks = [];

        this.setBuildingBlocks(buildingBlocks);

        this.setMovementTimeoutMs(movementTimeoutMs);
        this.setMovementPrecision(movementPrecision);
        this.setBuildUpThreshold(buildUpThreshold);
    }

    /**
     * @param {string[]} blocks - Item names the bot may use for building.
     * @throws {CiceroneError} If blocks is not an array, or contains non-string entries.
     * */
    setBuildingBlocks(blocks) {
        if (!Array.isArray(blocks)) {
            throw new CiceroneError('buildingBlocks must be an array of item names.');
        }
        if (blocks.some((b) => typeof b !== 'string' || b.length === 0)) {
            throw new CiceroneError('buildingBlocks must only contain non-empty strings.');
        }

        this._buildingBlocks = blocks;
    }

    /**
     * Fail-soft accessor: returns whatever is currently configured, possibly an empty array.
     * Use this where the caller can reasonably handle "no building blocks configured" itself.
     *
     * @returns {string[]}
     * */
    getBuildingBlocks() {
        return this._buildingBlocks;
    }

    /**
     * Fail-fast accessor: use this where building blocks are strictly required to proceed
     * (e.g. Placer.placeBuildingBlock). Throws immediately instead of letting the caller fail
     * later with a less specific error (e.g. "no matching item in inventory").
     *
     * @returns {string[]}
     * @throws {CiceroneError} If no building blocks are configured.
     * */
    requireBuildingBlocks() {
        if (this._buildingBlocks.length === 0) {
            throw new CiceroneError(
                'No building blocks configured. Call settings.setBuildingBlocks([...]) first.',
            );
        }
        return this._buildingBlocks;
    }

    /**
     * @param {number} ms - Must be a positive number.
     * @throws {CiceroneError} If ms is not a positive number.
     * */
    setMovementTimeoutMs(ms) {
        if (typeof ms !== 'number' || !Number.isFinite(ms) || ms <= 0) {
            throw new CiceroneError('movementTimeoutMs must be a positive number.');
        }
        this._movementTimeoutMs = ms;
    }

    /**
     * @returns {number}
     * */
    getMovementTimeoutMs() {
        return this._movementTimeoutMs;
    }

    /**
     * @param {number} precision - Must be a positive number.
     * @throws {CiceroneError} If precision is not a positive number.
     * */
    setMovementPrecision(precision) {
        if (typeof precision !== 'number' || !Number.isFinite(precision) || precision <= 0) {
            throw new CiceroneError('movementPrecision must be a positive number.');
        }
        this._movementPrecision = precision;
    }

    /**
     * @returns {number}
     * */
    getMovementPrecision() {
        return this._movementPrecision;
    }

    /**
     * @param {number} threshold - Must be a positive number. Values around 1.0-1.2 make sense
     *  for a single block's height; larger values are unusual but not rejected outright.
     * @throws {CiceroneError} If threshold is not a positive number.
     * */
    setBuildUpThreshold(threshold) {
        if (typeof threshold !== 'number' || !Number.isFinite(threshold) || threshold <= 0) {
            throw new CiceroneError('buildUpThreshold must be a positive number.');
        }
        this._buildUpThreshold = threshold;
    }

    /**
     * @returns {number}
     * */
    getBuildUpThreshold() {
        return this._buildUpThreshold;
    }
}

module.exports = CiceroneSettings;
