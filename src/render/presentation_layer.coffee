#= require jcanvas
#= require engine
#= require helpers

class PresentationLayer
  constructor: (@canvas, @seeker) ->
    @engine = new Engine()
    @attachInputHandlersTo @canvas, @seeker

  attachInputHandlersTo: (canvas, seeker) ->
    Engine = @engine
    self = @

    canvas.ondrop = (event) ->
      event.preventDefault()
      uploadFileFrom event, (image) ->
        actorId = uniqueId()
        $(canvas).drawImage(
          name: actorId
          source: image.src, draggable: true,
          x: event.layerX, y: event.layerY,
          scale: 0.3,
          dragstop: (actor) ->
            Engine.updateOrCreateKeyframe(actor, self.currentFrame())
        )
        actor = $(self.canvas).getLayer(actorId)
        Engine.updateOrCreateKeyframe(actor, self.currentFrame())

    seeker.oninput = (event) ->
      self.interpolateFrame(parseInt event.target.value)

    canvas.ondragover = (event) ->
      event.preventDefault()

  currentFrame: ->
    parseInt @seeker.value

  interpolateFrame: (frame) ->
    for actor in $(@canvas).getLayers()
      $(@canvas).setLayer actor.name, @engine.interpolate(actor, frame).state
    $(@canvas).drawLayers()

  play: ->
    if seeker.value < seeker.max
      seeker.value += 1

window.PresentationLayer = PresentationLayer