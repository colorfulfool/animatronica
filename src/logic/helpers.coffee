onlyChangedAttributes = (nuw, old) ->
  diff = {}
  for key in Object.values(old)
    diff[key] = nuw[key] if nuw[key] != old[key]

uploadFileFrom = (event, callback) ->
  file = event.dataTransfer.files[0]
  reader = new FileReader()
  reader.onload = (event) ->
    img = new Image()
    img.src = event.target.result
    img.onload = (event) -> callback(this)
  reader.readAsDataURL(file)


window.onlyChangedAttributes = onlyChangedAttributes
window.uploadFileFrom = uploadFileFrom