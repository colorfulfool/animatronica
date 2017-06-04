#= require keyframe
#= require helpers

class Engine
  updateOrCreateKeyframe: (actor, frame) ->
    keyframe = new Keyframe(frame, actor.name)
    keyframe.pullStateFrom actor # TODO: only pull what was changed NOW
    keyframe.persist()

  interpolate: (actor, frame) ->
    Keyframe.interpolateAt(frame, actor.name)

window.Engine = Engine