$(function () {
  var playing = false;
  var clock;

  $('#play').click(function () {
    if (playing) {
      playing = false
      this.textContent = '▶︎'
    } else {
      playing = true
      this.textContent = 'Ⅱ'

      button = this
      var clock = setInterval(function () {
        if (playing) {
          seeker.value = parseInt(seeker.value) + 2
        } else {
          clearInterval(clock)
        }
        if (parseInt(seeker.value) >= parseInt(seeker.max)) {
          seeker.value = 0
          button.textContent = '▶︎'
          playing = false
        }
        $(seeker).trigger('input')
      }, 20)
    }
  })

  $('#fake-seeker').on('input', function () {
    $(this).replaceWith("Not this one, that one! ↘")
  })
})  