import {
  SHOW_BUTTER_BAR,
  HIDE_BUTTER_BAR,
} from '../constants/action-types.js'
import m from '../m.js'

const butterBarReducer = (state = { shouldShowButterBar: false }, action) => {

  switch (action.type) {
    case SHOW_BUTTER_BAR:
      return Object.assign({}, state, { shouldShowButterBar: true })
    case HIDE_BUTTER_BAR:
      return Object.assign({}, state, { shouldShowButterBar: false })
    default:
      return state;
    }
  }

export default butterBarReducer
