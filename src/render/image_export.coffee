#= require gif

class ImageExport
  generateGif: (callback) ->
    gif = new GIF(workers: 2)

    self = @
    frameDelay = 20 * (AnimatronicaSettings.renderEach-1)

    @eachFrameOfAutoCroppedSequence (frame) ->
      self.drawFrame(frame)
      gif.addFrame(self.canvas, copy: true, delay: frameDelay)

    gif.on 'finished', (blob) ->
      callback URL.createObjectURL(blob)

    gif.render()


window.ImageExport = ImageExport