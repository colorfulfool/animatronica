class ActorManipulation
  pullStateFrom: (actor) ->
    @state = {x: actor.x, y: actor.y}


window.ActorManipulation = ActorManipulation