onlyChangedAttributes = (nuw, old) ->
  diff = {}
  for key in Object.keys(old)
    diff[key] = nuw[key] if nuw[key] != old[key]
  diff

uploadFileFrom = (event, callback) ->
  if event.dataTransfer.files.length # it's a file
    file = event.dataTransfer.files[0]
    reader = new FileReader()
    reader.onload = (event) ->
      img = new Image()
      img.src = event.target.result
      img.onload = (event) -> callback(this)
    reader.readAsDataURL(file)
  else # it's an <img>
    imageSrc = event.dataTransfer.getData('url')
    callback({src: imageSrc})

uniqueId = ->
  s4 = ->
    Math.floor((1 + Math.random()) * 0x10000).toString(16).substring 1
  s4() + s4()

paddedRange = (start, end, step) ->
  neededNumberOfChunks = Math.ceil((end-start) / step) + 1
  numberOfChunks = (end-start) / step
  chunksToAdd = neededNumberOfChunks - numberOfChunks
  array = _.range(start, end + chunksToAdd*step, step)


window.onlyChangedAttributes = onlyChangedAttributes
window.uploadFileFrom = uploadFileFrom
window.uniqueId = uniqueId
window.paddedRange = paddedRange