#= require jcanvas
#= require engine
#= require helpers

class PresentationLayer
  constructor: (@canvas, @seeker) ->
    @attachInputHandlersTo @canvas
    @engine = new Engine()

  attachInputHandlersTo: (canvas) ->
    Engine = @engine
    currentFrame = @currentFrame

    canvas.ondrop = (event) ->
      event.preventDefault()
      uploadFileFrom event, (image) ->
        $(canvas).drawImage(
          source: image.src, draggable: true,
          x: event.layerX, y: event.layerY,
          scale: 0.3,
          dragstop: (layer) ->
            Engine.updateOrCreateKeyframe(actor, currentFrame())
        )
        Engine.updateOrCreateKeyframe(image, currentFrame())

    canvas.ondragover = (event) ->
      event.preventDefault()

  currentFrame: ->
    parseInt @seeker.value

  createActor: (image) ->
    actor = new Actor(image)
    @actors.append(image)
    @engine.updateOrCreateKeyframe(actor, @currentFrame())

  interpolateFrame: (frame) ->
    @engine.interpolateFrame(frame)

window.PresentationLayer = PresentationLayer