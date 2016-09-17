import m from '../m.js'
import {
  ADD_ACTIVITY,
  REMOVE_ACTIVITY,
  SET_USER,
} from '../constants/action-types.js'

const SCREEN = {
  create: 0,
  list: 1,
  edit: 2,
  loggedOut: 3,
  uninitialized: 4,
  notificationsOptIn: 5
};

export function screens(state = {
  screen: SCREEN.uninitialized
}, action) {
  switch (action.type) {
    case GOTO_SCREEN:
      return m({}, state, { screen: action.screen });
    case GOTO_EDIT_SCREEN:
      return m({}, state, { screen: SCREEN.edit, activityForEditing: action.activityForEditing });
    case GOTO_CREATE_SCREEN:
      return m({}, state, { screen: SCREEN.create, activityForEditing: undefined });
    case GOTO_NEXT_SCREEN:
      return m({}, state, { screen: state.nextScreen });
    case QUEUE_NEXT_SCREEN:
      return m({}, state, { nextScreen: action.nextScreen, optInReason: action.optInReason });
    default:
      return state;
  }
}
