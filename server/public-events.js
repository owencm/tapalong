const normalizedSF = [
  {
    templates: [
      'checking out %',
    ],
    events: [
      { title: 'the de Young', url: 'http://www.google.com/search?q=de%20Young%20museum'},
      { title: 'SF MOMA', url: 'http://www.google.com/search?q=SF%20MOMA'},
      { title: 'Cal Academy of Sciences ($35)', url: 'http://www.google.com/search?q=Cal%20Academy%20of%20Sciences'},
      { title: 'Cal Academy of Sciences NightLife ($15)', url: 'http://www.google.com/search?q=Cal%20Academy%20of%20Sciences%20NightLife'},
      { title: 'the Exploratorium ($30)', url: 'http://www.google.com/search?q=Exploratorium%20SF'},
      { title: 'the Soma food trucks', url: 'http://www.somastreatfoodpark.com/'},
      { title: 'the Legion of Honor', url: 'http://www.google.com/search?q=Legion%20of%20Honor'},
      { title: 'the Conservatory of Flowers', url: 'https://goldengatepark.com/conservatory-of-flowers.html'},
      { title: 'the San Francisco Zoo ($20)', url: 'http://www.google.com/search?q=San%20Francisco%20Zoo'},
      { title: 'the USS Pampanito', url: 'http://www.google.com/search?q=USS%20Pampanito'},
    ],
  },
  {
    templates: [
      'checking out %',
      'exploring SF (% perhaps?)',
    ],
    events: [
      { title: 'Coit Tower', url: 'http://www.google.com/search?q=Coit%20Tower'},
      { title: 'Palace of Fine Arts', url: 'http://www.google.com/search?q=Palace%20of%20Fine%20Arts'},
      { title: 'Sutro Baths', url: 'http://www.google.com/search?q=Sutro%20Baths'},
      { title: 'Japanese Tea Garden', url: 'http://www.google.com/search?q=Japanese%20Tea%20Garden'},
      { title: 'Fisherman\'s Wharf', url: 'http://www.google.com/search?q=Fishermans%20Wharf'},
      { title: 'Pier 39', url: 'http://www.google.com/search?q=Pier%2039'},
      { title: 'Ocean Beach', url: 'http://www.google.com/search?q=Ocean%20Beach'},
    ],
  },
  {
    templates: [
      'taking a tour of %',
    ],
    events: [
      { title: 'Alcatraz', url: 'http://www.google.com/search?q=Alcatraz%20tour'},
      { title: 'Angel Island', url: 'http://www.google.com/search?q=Angel%20Island'},
    ],
  },
  {
    templates: [ '%' ],
    events: [
      { title: 'going to the Ferry Building farmers market', url: 'http://www.ferrybuildingmarketplace.com/farmers-market/'},
      { title: 'getting brunch', url: 'https://www.google.com/maps/search/brunch/'},
      { title: 'walking up Twin Peaks', url: 'https://www.google.com/maps/place/Twin+Peaks,+San+Francisco'},
      { title: 'hanging out in Dolores Park', url: 'https://www.google.com/maps/place/Mission+Dolores+Park/'},
      { title: 'camping somewhere', url: 'http://www.google.com/search?q=camping'},
      { title: 'spending the weekend in Napa', url: 'http://www.google.com/search?q=napa%20valley'}
    ],
  },
  {
    templates: [ 'hiking %' ],
    events: [
      { title: 'Muir Woods', url: 'http://www.google.com/search?q=Muir%20Woods'},
      { title: 'Stinson Beach', url: 'http://www.google.com/search?q=Stinson%20Beach'},
      { title: 'the dish at Stanford', url: 'http://www.google.com/search?q=stanford%20dish%20hike'},
    ]
  }
]

const normalizedEverywhere = [
  {
    templates: [ '%' ],
    events: [
      { title: 'hosting dinner for those interested' },
      { title: 'playing board games', },
      { title: 'watching a movie', },
      { title: 'working in a coffee shop', url: 'https://www.google.com/maps/search/Coffee+Shops/' },
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
