import {
  PUSH_ROUTE,
  POP_ROUTE,
  REPLACE_ROUTE,
} from '../constants/action-types.js'

// For now we'll start with the list as the root
const initialState = {
  index: 0,
  routes: [
    {
      key: 'uninitialized',
      title: ' ',
    },
  ]
}

const navigationState = (state = initialState, action) => {

  switch (action.type) {

    case PUSH_ROUTE:
      if (state.routes[state.index].key === (action.route && action.route.key)) return state
      return NavigationStateUtils.push(state, action.route)

    case POP_ROUTE:
      if (state.index === 0 || state.routes.length === 1) return state
      return NavigationStateUtils.pop(state)

    case REPLACE_ROUTE:
      return NavigationStateUtils.reset(state, [action.route], 0)

    default:
      return state

  }
}

export default navigationState
