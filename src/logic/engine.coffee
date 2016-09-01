#= require keyframe
#= require helpers

class Engine
  updateOrCreateKeyframe: (actor, frame) ->
    keyframe = new Keyframe(actor, frame)
    keyframe.state = onlyChangedAttributes(actor.state, @interpolate(actor, frame))
    keyframe.persist()

  interpolate: (actor, frame) ->
    Keyframe.interpolateFor(frame, actor).state

  interpolateFrame: (frame) ->
    for keyframe in Keyframe.allForFrame(frame)
      keyframe.act()


window.Engine = Engine