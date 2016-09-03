QUnit.module 'Keyframe', beforeEach: ->
  Keyframe.storage = {
    'sonic': {
      0: {x: 10, y: 10},
      10: {x: 0, y: 0},
      60: {x: 50}
    },
    'tails': {
      15: {x: 0, y: 0},
      80: {x: 0, y: 50}
    }
  }

QUnit.test 'rangeOfFrames', (assert) ->
  assert.deepEqual Keyframe.rangeOfFrames(), _.range(0, 80, AnimatronicaSettings.renderEach)

# QUnit.test 'overwrite existing keyframe by writing close to it', (assert) ->
#   keyframe = new Keyframe(10+8, 'sonic') # should overwrite 10
#   keyframe.state = {x: 42, y: 42}
#   keyframe.persist()

#   keyframes = Keyframe.storage['sonic']
#   assert.equal Object.keys(keyframes).length, 3
#   assert.propsEqual keyframes[18], {x: 42, y: 42}