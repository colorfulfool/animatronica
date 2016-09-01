onlyChangedAttributes = (nuw, old) ->
  diff = {}
  for key in Object.values(old)
    diff[key] = nuw[key] if nuw[key] != old[key]


window.onlyChangedAttributes = onlyChangedAttributes