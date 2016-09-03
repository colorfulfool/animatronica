class CropToPaper
  paperDimensions: ->
    shoulderSize = (@canvas.width - @canvas.height - 50)/2
    {
      x: shoulderSize, width: @canvas.width - shoulderSize*2, 
      y: 0, height: @canvas.height
    }

  drawThePaper: ->
    $(@canvas).drawRect(
      _.extend {fillStyle: '#fff', fromCenter: false, layer: true}, @paperDimensions()
    )


window.CropToPaper = CropToPaper