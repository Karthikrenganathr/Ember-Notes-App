import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | main-page/note', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    let route = this.owner.lookup('route:main-page/note');
    assert.ok(route);
  });
});
