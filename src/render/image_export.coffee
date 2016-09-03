#= require gif

class ImageExport
  generateGif: (callback) ->
    gif = new GIF(@cropDimentions @paperDimensions())

    self = @
    frameDelay = 20 * (AnimatronicaSettings.renderEach-1)

    @eachFrameOfAutoCroppedSequence (frame) ->
      self.drawFrame(frame)
      gif.addFrame(self.canvas, copy: true, delay: frameDelay)

    gif.on 'finished', (blob) ->
      callback URL.createObjectURL(blob)

    gif.render()

  cropDimentions: (dimentions) ->
    _.extend dimentions, {fullWidth: @canvas.width, fullHeight: @canvas.height}


window.ImageExport = ImageExport