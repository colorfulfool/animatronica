#= require gif

class ImageExport
  generateGif: (callback) ->
    gif = new GIF(workers: 2, quality: 10)

    self = @
    # canvasContext = @canvas.getContext('2d', 300, 300)
    frameDelay = 20 * AnimatronicaSettings.dropEach

    @eachFrameOfAutoCroppedSequence (frame) ->
      self.drawFrame(frame)
      gif.addFrame(self.canvas, delay: frameDelay, copy: true)

    gif.on 'finished', (blob) ->
      callback URL.createObjectURL(blob)

    gif.render()


window.ImageExport = ImageExport