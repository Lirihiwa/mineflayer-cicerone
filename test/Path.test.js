const test = require('node:test');
const assert = require('node:assert');
const { Vec3 } = require('vec3');
const plugin = require('../index');

test('Isolated Path construction and fluent API chaining', () => {
    const actionRegistry = new plugin.ActionRegistry();
    const structureRegistry = new plugin.PathStructureRegistry();

    // Register mocks actions
    actionRegistry.register('move', async () => {});
    actionRegistry.register('dig', async () => {});

    const startPos = new Vec3(0, 0, 0);
    const path = new plugin.Path(startPos, actionRegistry, structureRegistry);

    assert.strictEqual(path.pathElements.length, 1);

    // Test chaining is works
    path.add(new Vec3(1, 0, 0), 'move').add(new Vec3(2, 0, 0), 'dig');
    assert.strictEqual(path.pathElements.length, 2);
    assert.strictEqual(path.pathElements[1].children.length, 1);
});
