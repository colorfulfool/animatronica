#= require keyframe
#= require helpers

class Engine
  updateOrCreateKeyframe: (actor, frame) ->
    keyframe = new Keyframe(actor.name, frame)
    keyframe.state = onlyChangedAttributes(actor.state, @interpolate(actor, frame))
    keyframe.persist()

  interpolate: (actor, frame) ->
    Keyframe.interpolateFor(frame, actor.name).state


window.Engine = Engine