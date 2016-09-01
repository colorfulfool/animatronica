#= require jcanvas
#= require engine
#= require helpers

class PresentationLayer
  constructor: (@canvas, @seeker) ->
    @engine = new Engine()
    @attachInputHandlersTo @canvas, @seeker

  attachInputHandlersTo: (canvas, seeker) ->
    Engine = @engine
    currentFrame = @currentFrame

    canvas.ondrop = (event) ->
      event.preventDefault()
      uploadFileFrom event, (image) ->
        $(canvas).drawImage(
          name: uniqueId()
          source: image.src, draggable: true,
          x: event.layerX, y: event.layerY,
          scale: 0.3,
          load: (actor) ->
            Engine.updateOrCreateKeyframe(actor, currentFrame())
          dragstop: (actor) ->
            Engine.updateOrCreateKeyframe(actor, currentFrame())
        )

    seeker.onchange = (event) ->
      @interpolateFrame(parseInt event.target.value)

    canvas.ondragover = (event) ->
      event.preventDefault()

  currentFrame: ->
    parseInt @seeker.value

  interpolateFrame: (frame) ->
    for actor in $(@canvas).getLayers()
      actor.setState @engine.interpolate(actor, frame)

window.PresentationLayer = PresentationLayer