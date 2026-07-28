# mineflayer-cicerone

An action-execution and path-reversion navigation plugin for [Mineflayer](https://github.com/PrismarineJS/mineflayer).

`mineflayer-cicerone` provides a structured, highly modular way to handle complex movement, block manipulation, and path-reversion (undoing actions). By defining actions in a structured path tree, it allows you to execute a series of steps forward (`resolve`) or revert those operations backward (`revert`) to restore the local environment where possible.

---

## Features

- **Decoupled Architecture**: Fully customizable behaviors and structures using dedicated registries (`ActionRegistry`, `PathStructureRegistry`).
- **Path Action Reversion (`revert`)**: Restores the bot and local environment to previous states (e.g., placing back dug blocks, digging away placed block obstacles, building up/digging down).
- **Settings Management**: Centralized configuration for building block preferences, movement parameters, and custom vertical towering thresholds.
- **Advanced Movement**: Coordinate-based horizontal navigation (`goto`), automated jumping onto blocks (`jumpOn`), and safe cancellations.
- **Smart Tool Selection**: Evaluates block material, avoids using nearly-broken tools (durability $\le$ 5), and prioritizes Silk Touch for ores or Fortune for standard blocks.
- **Path Serialization**: Complete support for path tree serialization to and from JSON formats.

---

## Installation

Install the package via npm:

```bash
npm install mineflayer-cicerone
```

---

## Quick Start

```javascript
const mineflayer = require('mineflayer');
const cicerone = require('mineflayer-cicerone');
const { Vec3 } = require('vec3');

const bot = mineflayer.createBot({
    host: 'localhost',
    port: 25565,
    username: 'CiceroneBot',
});

// Load the plugin
bot.loadPlugin(cicerone);

bot.once('spawn', async () => {
    // Configure allowable building blocks (required for placing/towering)
    bot.cicerone.settings.setBuildingBlocks(['cobblestone', 'dirt', 'oak_planks']);

    // Create a new path rooted at the bot's current position
    const path = bot.cicerone.createPath();

    const startPos = bot.entity.position.floored();

    // Define a simple path sequence
    path.add(startPos.offset(1, 0, 0), 'move');
    path.add(startPos.offset(2, 0, 0), 'dig');      // Dig a block ahead
    path.add(startPos.offset(2, -1, 0), 'place');   // Place a block to fill a hole
    path.add(startPos.offset(2, 0, 0), 'move');

    try {
        console.log('Executing path...');
        await path.resolve(); // Equivalent to: bot.cicerone.resolve(path);
        console.log('Path completed successfully.');

        // Wait 5 seconds
        await bot.waitForTicks(100);

        console.log('Reverting path...');
        await path.revert();  // Equivalent to: bot.cicerone.revert(path);
        console.log('Path reverted successfully.');
    } catch (err) {
        console.error('An error occurred during path execution:', err.message);
    }
});
```

---

## API Reference

### Settings & Configuration

Settings are managed via `bot.cicerone.settings` using fail-safe getter and setter methods.

#### `bot.cicerone.settings.setBuildingBlocks(blocks)`
Sets the item names the bot can use for building blocks.
* `blocks`: `string[]`

#### `bot.cicerone.settings.getBuildingBlocks()`
Returns the list of configured building blocks.
* Returns: `string[]`

#### `bot.cicerone.settings.setMovementTimeoutMs(ms)`
Sets the maximum time in milliseconds a single `goto` operation can take.
* `ms`: `number` (Positive)

#### `bot.cicerone.settings.setMovementPrecision(precision)`
Sets the destination arrival radius (in blocks).
* `precision`: `number` (Positive)

#### `bot.cicerone.settings.setBuildUpThreshold(threshold)`
Sets the vertical height threshold on the Y-axis the bot must clear before placing a block underneath itself during towering.
* `threshold`: `number` (Positive, default `1.1`)

---

### Actions API (`bot.cicerone.actions`)

Direct world and movement interaction commands are grouped under `bot.cicerone.actions`:

#### `await bot.cicerone.actions.goto(vec, [options])`
Moves the bot to the horizontal destination.
* `vec`: `Vec3`
* `options` (optional): `{ precision?: number, timeout?: number }`

#### `await bot.cicerone.actions.jumpOn(vec, [options])`
Forces the bot to jump onto a specified block.
* `vec`: `Vec3`
* `options` (optional): Movement options passed to the post-jump `goto` check.

#### `bot.cicerone.actions.stopMove()`
Forcefully stops any in-flight movement action.

#### `await bot.cicerone.actions.digBlock(position)`
Mines the target block using the best available tool in the inventory.
* `position`: `Vec3`

#### `await bot.cicerone.actions.placeBuildingBlock(position)`
Places a building block at the target coordinate against a solid neighbor block.
* `position`: `Vec3`

#### `await bot.cicerone.actions.buildUp()`
Performs a jump-and-place towering sequence.

---

### Custom Actions Registration

You can dynamically extend `mineflayer-cicerone` with your own custom actions using the `ActionRegistry`.

#### `bot.cicerone.actionRegistry.register(type, resolveHandler, [revertHandler])`
Registers a unique action identifier with a forward resolve handler and an optional backward revert handler.

```javascript
// Register a custom door opener
bot.cicerone.actionRegistry.register(
    'openDoor',
    async (position) => {
        const block = bot.blockAt(position);
        if (!block) throw new cicerone.CiceroneError(`No block at ${position}`);
        await bot.activateBlock(block);
    },
    async (position) => {
        // Closing a door is identical to activating it again
        const block = bot.blockAt(position);
        if (block) await bot.activateBlock(block);
    }
);
```

Once registered, the action can be added directly to any path sequence:
```javascript
path.add(doorPosition, 'openDoor');
```

---

### Custom Path Structure Rules

If you register a custom action type that alters how the bot moves (such as a teleport or vertical leap), you must specify how the path structure organizes it using the `PathStructureRegistry`.

#### `bot.cicerone.structureRegistry.register(type, descriptor)`
* `type`: `string`
* `descriptor`: `Partial<StructureDescriptor>`
  * `createsNewStandPoint`: `boolean` (Create a new standpoint standpoint/parent)
  * `standOffset`: `Vec3 | null` (Offset applied to calculate standpoint position)
  * `relativeToLastParent`: `boolean` (Apply offset relative to the last standpoint instead of target)
  * `standPointType`: `string | null` (The action type assigned to the standpoint, defaults to current)
  * `attachAsChildOfNewStandPoint`: `boolean` (Attach this action as a child of the newly created standpoint)

---

### Path Planning Classes

#### `Path`

* `path.add(position, type)`: Appends an action to the path sequence. Built-in types: `'move'`, `'dig'`, `'place'`, `'jumpOn'`, `'up'`, `'down'`.
* `await path.resolve()`: Executes path elements sequentially.
* `await path.revert()`: Undoes path elements in reverse order.
* `path.reset(startPosition)`: Clears elements and sets a new starting root coordinate.
* `path.toJSON()`: Serializes path elements.
* `Path.fromJSON(json, actionRegistry, structureRegistry)`: Rebuilds a serialized path tree.

---

## License

This project is licensed under the [MIT License](LICENSE).