const normalized = [
  {
    generics: [
      'checking out %',
    ],
    options: [
      'the de Young',
      'SF MOMA',
      'Cal Academy of Sciences',
      'the Exploratorium',
      'the Soma food trucks',
      'the Legion of Honor',
      'the Conservatory of Flowers',
      'the San Francisco Zoo',
      'the USS Pampanito',
    ],
  },
  {
    generics: [
      'checking out %',
      'exploring SF (% perhaps)',
    ],
    options: [
      'Coit Tower',
      'Palace of Fine Arts',
      'Sutro Baths',
      'Japanese Tea Garden',
      'Fisherman\'s Warf',
      'Peer 39',
      'Ocean Beach',
    ],
  },
  {
    generics: [
      'touring %',
    ],
    options: [
      'Alcatraz',
      'Angel Island',
    ],
  },
  {
    generics: [ '%' ],
    options: [
      'going to the Ferry Building farmers market',
      'getting brunch',
      'walking up Twin Peaks',
      'hanging out in Dolores Park',
    ],
  }
]

const denormalized = normalized.map((set) => {
  return set.generics.map((generic) => {
    const replaceIndex = generic.indexOf('%')
    const prefix = generic.slice(0, replaceIndex)
    const postfix = generic.slice(replaceIndex + 1, generic.length)
    return set.options.map((option) => {
      return prefix + option + postfix
    })
  })
})

const flatten = (arr) => [].concat.apply([], arr)

const denormalizedAndFlattened = flatten(flatten(denormalized))

const shuffle = (array) => {
  let currentIndex = array.length
  let temporaryValue
  let randomIndex

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

// This is theoretically innefficient, but not too bad for small arrays
const selectNAtRandom = (n, arr) => {
  return shuffle(arr).slice(0, n)
}

module.exports = {
  allPublicPlans: denormalizedAndFlattened,
  selectNPublicPlans: (n) => selectNAtRandom(n, denormalizedAndFlattened),
}
