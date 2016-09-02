#= require jcanvas
#= require engine
#= require helpers
#= require image_export

class PresentationLayer
  @include ImageExport

  constructor: (@canvas, @seeker) ->
    @engine = new Engine()
    @warmUpCanvas()
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
          add: (actor) ->
            Engine.updateOrCreateKeyframe(actor, self.currentFrame())
          dragstop: (actor) ->
            Engine.updateOrCreateKeyframe(actor, self.currentFrame())
        )

    seeker.oninput = (event) ->
      self.drawFrame(parseInt event.target.value)

    canvas.ondragover = (event) ->
      event.preventDefault()

  currentFrame: ->
    parseInt @seeker.value

  drawFrame: (frame) ->
    for actor in $(@canvas).getLayers()
      $(@canvas).setLayer actor.name, @engine.interpolate(actor, frame).state
    $(@canvas).drawLayers()

  warmUpCanvas: ->
    $(@canvas).drawRect(fillStyle: '#fff', x: 0, y: 0, width: 20, height: 20)

window.PresentationLayer = PresentationLayer