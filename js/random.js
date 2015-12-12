function randint(min, max) {
    return Math.round(Math.random() * (max - min)) + min;
}

function choice(array) {
    return array[randint(0, array.length - 1)]
}

function shuffle(array) {
  var currentIndex = array.length, randomIndex, result = fillArray(undefined, array.length);

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    result[currentIndex] = array[randomIndex];
    result[randomIndex] = array[currentIndex];
  }

  return result;
}