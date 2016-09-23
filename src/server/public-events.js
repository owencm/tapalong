const normalizedSF = [
  {
    templates: [
      'checking out %',
    ],
    events: [
      { title: 'the de Young', },
      { title: 'SF MOMA', },
      { title: 'Cal Academy of Sciences', },
      { title: 'the Exploratorium', },
      { title: 'the Soma food trucks', },
      { title: 'the Legion of Honor', },
      { title: 'the Conservatory of Flowers', },
      { title: 'the San Francisco Zoo', },
      { title: 'the USS Pampanito', },
    ],
  },
  {
    templates: [
      'checking out %',
      'exploring SF (% perhaps?)',
    ],
    events: [
      { title: 'Coit Tower', },
      { title: 'Palace of Fine Arts', },
      { title: 'Sutro Baths', },
      { title: 'Japanese Tea Garden', },
      { title: 'Fisherman\'s Warf', },
      { title: 'Peer 39', },
      { title: 'Ocean Beach', },
    ],
  },
  {
    templates: [
      'taking a tour of %',
    ],
    events: [
      { title: 'Alcatraz', },
      { title: 'Angel Island', },
    ],
  },
  {
    templates: [ '%' ],
    events: [
      { title: 'going to the Ferry Building farmers market', },
      { title: 'getting brunch', },
      { title: 'walking up Twin Peaks', },
      { title: 'hanging out in Dolores Park', },
      { title: 'camping somewhere', },
      'spending the weekend in Napa'
    ],
  },
  {
    templates: [ 'hiking %' ],
    events: [
      { title: 'Muir Woods', },
      { title: 'Stinson Beach', },
      { title: 'the dish at Stanford', },
    ]
  }
]

const normalizedEverywhere = [
  {
    templates: [ '%' ],
    events: [
      { title: 'playing board games', },
      { title: 'watching a movie', },
      { title: 'working and reading in a coffee shop', },
    ],
  }
]

const flatten = (arr) => [].concat.apply([], arr)

const normalized = flatten([normalizedSF, normalizedEverywhere])

const denormalized = normalized.map((set) => {
  return set.templates.map((template) => {
    const replaceIndex = template.indexOf('%')
    const prefix = template.slice(0, replaceIndex)
    const postfix = template.slice(replaceIndex + 1, template.length)
    return set.events.map((event) => {
      return {
        title: prefix + event.title + postfix,
        url: event.url ? event.url : '',
      }
    })
  })
})

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
  allPublicEvents: denormalizedAndFlattened,
  selectNPublicEvents: (n) => selectNAtRandom(n, denormalizedAndFlattened),
}
