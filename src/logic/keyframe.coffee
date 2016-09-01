#= require interpolation
#= require actor_manipulation

class Keyframe
  @include Interpolation
  @include ActorManipulation

  @storage = {}

  @interpolateFor: (frame, actor) ->
    keyframe = new Keyframe(frame, actor)
    for axis of keyframe.state
      [prev, next] = keyframe.nearestChangesByAxis(axis)
      keyframe.state[axis] = keyframe.interpolateBetween(prev, next, frame)
    keyframe

  constructor: (@frame, @actor) ->
    @state = {x: undefined, y: undefined}

  persist: ->
    Keyframe.storage[@actor] = {} unless Keyframe.storage[@actor]?
    Keyframe.storage[@actor][@frame] = {} unless Keyframe.storage[@actor][@frame]?

    for axis of @state
      Keyframe.storage[@actor][@frame][axis] = @state[axis]


window.Keyframe = Keyframe