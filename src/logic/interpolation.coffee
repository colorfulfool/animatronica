class Interpolation
  nearestChangesByAxis: (axis) ->
    frames = Keyframe.storage[@actor]
    return [] unless frames?

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
    return first.value if first.frame == last.frame

    first.value + (last.value - first.value) * (frame - first.frame)/(last.frame - first.frame)

  snapToNearestKeyframe: (frame, options) ->
    closeEnoughKeyframes = @nearestChangesByAxis('x').filter (keyframe) ->
      keyframe? and Math.abs(keyframe.frame - frame) <= options.area/2
    if closeEnoughKeyframes.length
      closeEnoughKeyframes[0].frame
    else
      frame

window.Interpolation = Interpolation