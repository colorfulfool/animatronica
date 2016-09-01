class OutputLayer
  constructor: (canvas) ->
    @canvas = $(canvas)
    @engine = new Engine()

  createActor: (image) ->
    actor = new Actor(image)
    @actors.append(image)
    @engine.updateOrCreateKeyframe(actor, @currentFrame())

  interpolateFrame: (frame) ->
    @engine.interpolateFrame(frame)

window.OutputLayer = OutputLayer