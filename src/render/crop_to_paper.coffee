class CropToPaper
  paperDimensions: ->
    paperWidth = 450
    paperHeight = 400
    {
      x: (@canvas.width - paperWidth)/2, width: paperWidth, 
      y: (@canvas.height - paperHeight)/2, height: paperHeight
    }

  drawThePaper: ->
    $(@canvas).drawRect(
      _.extend {fillStyle: '#fff', fromCenter: false, layer: true}, @paperDimensions()
    )


window.CropToPaper = CropToPaper