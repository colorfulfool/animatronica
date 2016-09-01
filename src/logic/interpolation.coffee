class Interpolation
  nearestChangesByAxis: (axis) ->
    frames = Keyframe.storage[@actor]

    for n in Object.keys(frames)
      value = frames[n][axis]
      break if value == undefined or n > @frame
      prev = {frame: n, value: value}

    for n in Object.keys(frames).reverse()
      value = frames[n][axis]
      break if value == undefined or n < @frame
      next = {frame: n, value: value}

    return [prev, next]

  interpolateBetween: (first, last, frame) ->
    return first.value unless last?
    return last.value unless first?

    first.value + (last.value - first.value) * (frame - first.frame)/(last.frame - first.frame)

window.Interpolation = Interpolation