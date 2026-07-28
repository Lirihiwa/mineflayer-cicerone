# mineflayer-cicerone

An action-execution and path-reversion navigation plugin for [Mineflayer](https://github.com/PrismarineJS/mineflayer). 

`mineflayer-cicerone` provides a structured way to handle complex movement, digging, and placing sequences. By wrapping actions into path elements, it allows you to execute a series of steps forward (`resolve`) or reverse those operations (`revert`), replacing dug blocks and clearing placed block obstacles where applicable.

---

## Features

* **Advanced Movement**: Smooth coordinate-based navigation (`goto`), automated jumping onto blocks (`jumpOn`), and safe stopping.
* **Smart Digging**: Automatic tool selection matching the block's material. Evaluates tool durability (ignores tools with durability $\le$ 5) and prioritizes Silk Touch for ores or Fortune for other materials.
* **Block Placement & Towering**: Placing blocks next to reference blocks and vertical towering (`buildUp`).
* **Path Serialization**: Full support for exporting path sequences to JSON formats and reconstructing them later.
* **Action Reversion (`revert`)**: Attempts to return the bot and local environment to their previous states by undoing path steps (e.g., placing back dug blocks, digging away placed blocks).

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
    username: 'CiceroneBot'
});

// Load the plugin
bot.loadPlugin(cicerone);

bot.once('spawn', async () => {
    // Configure allowable building blocks (required for placing/towering)
    bot.cicerone.settings.buildingBlocks = ['cobblestone', 'dirt', 'oak_planks'];

    // Create a new path
    const path = new cicerone.Path();

    const startPos = bot.entity.position.floored();

    // Define a simple path sequence
    path.add(startPos.offset(1, 0, 0), 'move');
    path.add(startPos.offset(2, 0, 0), 'dig');      // Dig a block ahead
    path.add(startPos.offset(2, -1, 0), 'place');   // Place a block to fill a hole
    path.add(startPos.offset(2, 0, 0), 'move');

    try {
        console.log('Executing path...');
        await path.resolve(bot);
        console.log('Path completed successfully.');

        // Wait 5 seconds, then undo the path
        await bot.waitForTicks(100);

        console.log('Reverting path...');
        await path.revert(bot);
        console.log('Path reverted successfully.');
    } catch (err) {
        console.error('An error occurred during path execution:', err.message);
    }
});
```

---

## API Reference

### Configuration

#### `bot.cicerone.settings.buildingBlocks`
An array of item names (strings) that the bot is allowed to use for block-placing actions (e.g., `placeBuildingBlock`, `buildUp`).
```javascript
bot.cicerone.settings.buildingBlocks = ['dirt', 'cobblestone'];
```

---

### Movement Actions

#### `await bot.cicerone.goto(vec, [options])`
Moves the bot to the specified 3D coordinates on the horizontal plane.
* `vec`: `Vec3` targeting the destination.
* `options` (optional):
  * `precision` (default: `0.15`): Allowed arrival radius in blocks.
  * `timeout` (default: `30000`): Maximum execution time in milliseconds.

#### `await bot.cicerone.jumpOn(vec, [options])`
Forces the bot to jump and land on top of the block at the specified coordinate, then adjusts its exact position.
* `vec`: `Vec3` of the target block.
* `options`: Same as `goto` options.

#### `bot.cicerone.stopMove()`
Aborts the current movement sequence, rejecting the active movement promise.

---

### World Interaction Actions

#### `await bot.cicerone.digBlock(position)`
Retrieves the most suitable tool from the inventory and mines the block.
* `position`: `Vec3` of the block to mine.
* *Note*: If the tool runs low on durability ($\le$ 5), the bot avoids using it. If no matching tool is found, it attempts to mine by hand.

#### `await bot.cicerone.placeBuildingBlock(position)`
Places a building block at the specified position using an adjacent block as a support surface.
* `position`: `Vec3` where the block should be placed.
* *Note*: Requires suitable blocks in the inventory matching `bot.cicerone.settings.buildingBlocks`.

#### `await bot.cicerone.buildUp()`
Performs a jump-and-place operation, placing a building block directly underneath the bot.

---

### Path Planning Classes

The plugin exports helper classes for tracking actions and executing them in order.

#### `Path`
The main class representing a list of navigation and interaction steps.

* `new Path()`: Instantiates an empty path.
* `path.add(position, type)`: Adds an action. Supported types:
  * `'move'`: Walk to coordinate.
  * `'dig'`: Dig block at coordinate.
  * `'place'`: Place block at coordinate.
  * `'jumpOn'`: Jump onto a block.
  * `'up'` / `'down'`: Climb or descend vertically.
* `await path.resolve(bot)`: Sequentially executes each action in the path.
* `await path.revert(bot)`: Executes the path in reverse order, performing opposite actions (e.g., placing blocks back where they were dug).
* `path.reset()`: Empties the current path.
* `path.toJSON()`: Serializes the path elements into a raw object array.
* `Path.fromJSON(json)`: Reconstructs a `Path` instance from a JSON string or parsed array.

---

## License

This project is licensed under the [MIT License](LICENSE).
