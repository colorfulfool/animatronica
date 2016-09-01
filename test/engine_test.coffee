QUnit.module 'Engine'

engine = new Engine()
mockActor = {
  name: 'sonic',
  state: {x: 10, y: 10}
}

QUnit.test 'first keyframe for a new actor', (assert) ->
  engine.updateOrCreateKeyframe(mockActor, 0)

  firstKeyframe = Keyframe.storage['sonic'][0]
  assert.ok firstKeyframe?
  assert.propEqual firstKeyframe, {x: 10, y: 10}

QUnit.test 'update a keyframe', (assert) ->
  Keyframe.storage = {
    'sonic': { 0: {x: 10, y: 10} }
  }
  mockActor.state = {x: 10, y: 5}

  engine.updateOrCreateKeyframe(mockActor, 0)

  firstKeyframe = Keyframe.storage['sonic'][0]
  assert.propEqual firstKeyframe, {x: 10, y: 5}