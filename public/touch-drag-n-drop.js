$(function () {
  $('.examples img').on('touchstart', function () {
    $(this).clone().insertAfter(this)
    draggie = $(this)
    draggie.css('position', 'absolute')
    
    draggie.on('touchmove', updateImagePositionOnScreen)

    draggie.on('touchend', function (event) {
      canvas = document.getElementsByTagName('canvas')[0]
      dropImageOntoElement(this, canvas)
      $(this).remove()
    })
  })
})

function updateImagePositionOnScreen(event) {
  touch = event.targetTouches[0]
  $(this).css({
    top: (touch.pageY - this.height/2) + 'px', 
    left: (touch.pageX - this.width/2) + 'px'
  })
}

function dropImageOntoElement(image, canvas) {
  fakeDataTransfer = {
    files: [],
    getData: function () { return image.src }
  }
  canvas.ondrop($.Event('drop', {
    dataTransfer: fakeDataTransfer,
    layerX: relativeToCanvas(image.style, 'left'),
    layerY: relativeToCanvas(image.style, 'top')
  }))
}

function relativeToCanvas(value, axis) {
  return parseInt(value[axis].slice(0, -2)) - $(canvas).position()[axis]
}