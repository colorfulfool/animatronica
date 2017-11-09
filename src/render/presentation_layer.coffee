#= require jquery
#= require jcanvas

#= require engine
#= require helpers
#= require image_export
#= require crop_to_paper

class PresentationLayer
  @include ImageExport
  @include CropToPaper

  constructor: (@canvas, @seeker) ->
    @engine = new Engine()
    @drawThePaper()
    @attachInputHandlersTo(@canvas, @seeker)

  attachInputHandlersTo: (canvas, seeker) ->

    canvas.ondrop = (event) =>
      event.preventDefault()
      uploadFileFrom event, (image) =>
        actorId = uniqueId()
        $(canvas).drawImage(
          name: actorId
          source: image.src, draggable: true,
          x: event.layerX, y: event.layerY,
          scale: 0.3,
          add: (actor) =>
            @engine.updateOrCreateKeyframe(actor, @currentFrame())
          dragstop: (actor) =>
            @engine.updateOrCreateKeyframe(actor, @currentFrame())
        )

    seeker.oninput = (event) =>
      @drawFrame(parseInt event.target.value)

    canvas.ondragover = (event) =>
      event.preventDefault()

  currentFrame: ->
    parseInt @seeker.value

  drawFrame: (frame) ->
    for actor in Keyframe.allActors()
      $(@canvas).setLayer actor.name, @engine.interpolate(actor, frame).state
    $(@canvas).drawLayers()

  eachFrameOfAutoTrimmedSequence: (callback) ->
    for frameNum in Keyframe.rangeOfFrames()
      callback(frameNum)


window.PresentationLayer = PresentationLayer