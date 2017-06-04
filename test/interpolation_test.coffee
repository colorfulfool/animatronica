QUnit.module 'Interpolation', beforeEach: ->
  Keyframe.storage = {
    'sonic': {
      0: {'x': 10, 'y': 10},
      10: {'x': 0, 'y': 0},
      60: {'x': 50}
    }
  }

QUnit.test 'fetch known state', (assert) ->
  assert.deepEqual Keyframe.interpolateAt(0, 'sonic').state, {'x': 10, 'y': 10}

QUnit.test 'interpolate partially known', (assert) ->
  assert.deepEqual Keyframe.interpolateAt(60, 'sonic').state, {'x': 50, 'y': 0}

QUnit.test 'interpolate a tween from scratch', (assert) ->
  assert.deepEqual Keyframe.interpolateAt(35, 'sonic').state, {'x': 25, 'y': 0}

# internal workings

QUnit.test 'nearestChangesByAxis', (assert) ->
  keyframe = new Keyframe(25, 'sonic')

  [prev, next] = keyframe.nearestChangesByAxis('x')
  assert.equal( prev.frame, 10 )
  assert.equal( next.frame, 60 )

  [prev, next] = keyframe.nearestChangesByAxis('y')
  assert.equal( prev.frame, 10 )
  assert.equal( next, undefined )

QUnit.test 'interpolateBetween', (assert) ->
  keyframe = new Keyframe()
  assert.equal( keyframe.interpolateBetween({frame: 0, value: 0}, {frame: 10, value: 20}, 5), 10 )
  assert.equal( keyframe.interpolateBetween({frame: 10, value: 20}, undefined, 30), 20 )