onlyChangedAttributes = (nuw, old) ->
  diff = {}
  for key in Object.keys(old)
    diff[key] = nuw[key] if nuw[key] != old[key]
  diff

uploadFileFrom = (event, callback) ->
  file = event.dataTransfer.files[0]
  reader = new FileReader()
  reader.onload = (event) ->
    img = new Image()
    img.src = event.target.result
    img.onload = (event) -> callback(this)
  reader.readAsDataURL(file)

uniqueId = ->
  s4 = ->
    Math.floor((1 + Math.random()) * 0x10000).toString(16).substring 1
  s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4()

window.onlyChangedAttributes = onlyChangedAttributes
window.uploadFileFrom = uploadFileFrom
window.uniqueId = uniqueId