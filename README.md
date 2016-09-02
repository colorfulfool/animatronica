# How to use

Prepare an HTML canvas and a "current frame" input (I use `input type=range`). Pass them into PresentationLayer constructor.

```javascript
canvas = document.getElementById('board')
seeker = document.getElementById('seeker')
var animatronica = new PresentationLayer(canvas, seeker)
```

To **imitate playback**, increase your current frame input progressively — the canvas will react. I use a delay of 20ms. For my (crappy) example of this, see `play-button.js`.

To **generate a GIF** of the movie, call `generateGif`. It takes some time, hence the callback.

```javascript
animatronica.generateGif(function (imageUrl) {
  window.open(imageUrl)
})
```