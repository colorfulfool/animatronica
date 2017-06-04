$(function () {
  $('#export.button').click(function () {
  	exportLabel = $('#export.button').html()

    animatronica.generateGif(function (imageUrl) {
      $('#exported').html('<img src="' + imageUrl + '">')
      $('html,body').animate({scrollTop: $('#exported').offset().top - 27*3})
      $('#export.button').html(exportLabel)
    })
  	$('#export.button').html('Wait a sec...')
  })
})