import m from './m.js';
import { SCREEN } from './screens.js';

import {
  GOTO_SCREEN, GOTO_EDIT_SCREEN,
  GOTO_NEXT_SCREEN, QUEUE_NEXT_SCREEN,
  SET_USER
} from './actions.js'

export function screens(state = {
  screen: SCREEN.uninitialized
}, action) {
  switch (action.type) {
    case GOTO_SCREEN:
      return m({}, state, { screen: action.screen });
    case GOTO_EDIT_SCREEN:
      return m({}, state, { screen: SCREEN.edit, activityForEditing: action.activityForEditing });
    case GOTO_NEXT_SCREEN:
      return m({}, state, { screen: state.nextScreen });
    case QUEUE_NEXT_SCREEN:
      return m({}, state, { nextScreen: action.nextScreen, optInReason: action.optInReason });
    default:
      return state;
  }
}

export function user(state = {}, action) {
  switch (action.type) {
    case SET_USER:
      return m({}, state, {
        userId: action.userId,
        userName: action.userName,
        sessionToken: action.sessionToken
      });
    default:
      return state;
  }
};
