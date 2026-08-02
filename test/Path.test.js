const test = require('node:test');
const assert = require('node:assert');
const { Vec3 } = require('vec3');
const plugin = require('../index');

test('Isolated Path construction and fluent API chaining', () => {
    const actionRegistry = new plugin.ActionRegistry();

    // Register mocks actions
    actionRegistry.register('move', async () => {});
    actionRegistry.register('dig', async () => {});

    const path = new plugin.Path(actionRegistry);

    assert.strictEqual(path.elements.length, 0);

    // Test chaining is works
    path.add(new Vec3(1, 0, 0), 'move').add(new Vec3(2, 0, 0), 'dig');
    assert.strictEqual(path.elements.length, 2);
});
