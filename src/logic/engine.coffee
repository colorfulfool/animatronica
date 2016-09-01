#= require keyframe
#= require helpers

class Engine
  updateOrCreateKeyframe: (actor, frame) ->
    keyframe = new Keyframe(frame, actor.name)
    # keyframe.state = onlyChangedAttributes(actor.state, @interpolate(actor, frame))
    keyframe.state = actor.state
    keyframe.persist()

  interpolate: (actor, frame) ->
    Keyframe.interpolateFor(frame, actor.name).state


window.Engine = Engine