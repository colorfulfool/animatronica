#= require interpolation

class Keyframe
  @include Interpolation

  @storage = {}

  @interpolateFor: (frame, actor) ->
    keyframe = new Keyframe(frame, actor)
    for axis of keyframe.state
      [prev, next] = keyframe.nearestChangesByAxis(axis)
      keyframe.state[axis] = keyframe.interpolateBetween(prev, next, frame)
    keyframe

  constructor: (@frame, @actor) ->
    @state = {'x': undefined, 'y': undefined, 'rotation': undefined}

  persist: ->
    @storage[@frame][@actor.id] = state

  act: ->
    @actor.state = @state


window.Keyframe = Keyframe