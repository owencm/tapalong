import { POP_ROUTE, PUSH_ROUTE } from '../constants/action-types.js'

export function pushRoute (route) {
  return {
    type: PUSH_ROUTE,
    route
  }
}

export function popRoute () {
  return {
    type: POP_ROUTE
  }
}
