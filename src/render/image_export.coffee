#= require gif

class ImageExport
  generateGif = (callback) ->
    gif = new GIF(workers: 2, quality: 10)
    eachFrame (frame) ->
      @drawFrame frame
      gif.addFrame(@canvas, delay: 20)

    gif.on 'finished', (blob) ->
      callback URL.createObjectURL(blob)

    gif.render()


window.ImageExport = ImageExport