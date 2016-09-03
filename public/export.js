$(function () {
  $('#export.button').click(function () {
  	exportLabel = $('#export.button').html()

    window.animatronica.generateGif(function (imageUrl) {
      $('#exported').html('↳ <a href="' + imageUrl + '" target=blank>Download link</a>')
      $('#export.button').html(exportLabel)
    })
  	$('#export.button').html('Wait a sec...')
  })
})