#= require helpers
#= require interpolation
#= require actor_manipulation

class Keyframe
  @include Interpolation
  @include ActorManipulation

  @storage = {}

  @interpolateAt: (frame, actor) ->
    keyframe = new Keyframe(frame, actor)
    for axis of keyframe.state
      [prev, next] = keyframe.nearestChangesByAxis(axis)
      keyframe.state[axis] = keyframe.interpolateBetween(prev, next, frame)
    keyframe

  @rangeOfFrames: ->
    allFrames = {}
    for actor, frames of Keyframe.storage
      _.extend(allFrames, frames)
    frameNumbers = Object.keys(allFrames).map((n) -> parseInt(n))
    paddedRange _.min(frameNumbers), _.max(frameNumbers), AnimatronicaSettings.renderEach

  @allActors: ->
    {name: actorName} for actorName in Object.keys(Keyframe.storage)

  constructor: (@frame, @actor) ->
    @state = {x: undefined, y: undefined}

  persist: ->
    frame = @snapToNearestKeyframe(@frame, area: 10)

    Keyframe.storage[@actor] = {} unless Keyframe.storage[@actor]?
    Keyframe.storage[@actor][frame] = {} unless Keyframe.storage[@actor][frame]?

    for axis of @state
      Keyframe.storage[@actor][frame][axis] = @state[axis]


window.Keyframe = Keyframe