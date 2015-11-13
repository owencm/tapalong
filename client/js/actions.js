import { SCREEN } from './screens.js';
export const GOTO_SCREEN = 'GOTO_SCREEN';

export function gotoScreen(screen) {
  return {
    type: GOTO_SCREEN,
    screen
  }
}

export const GOTO_EDIT_SCREEN = 'GOTO_EDIT_SCREEN';

export function gotoEditScreen(activityForEditing) {
  return {
    type: GOTO_EDIT_SCREEN,
    activityForEditing
  }
}

export const GOTO_NEXT_SCREEN = 'GOTO_NEXT_SCREEN';

export function gotoNextScreen() {
  return {
    type: GOTO_NEXT_SCREEN
  }
}

export const QUEUE_NEXT_SCREEN = 'QUEUE_NEXT_SCREEN';

export function queueNextScreen(nextScreen, optInReason) {
  return {
    type: QUEUE_NEXT_SCREEN,
    nextScreen,
    optInReason
  }
}

/* User actions */

export const SET_USER = 'SET_USER';

export function setUser(userId, userName, sessionToken) {
  return {
    type: SET_USER,
    userId,
    userName,
    sessionToken
  }
}

/* Activities actions */

export const ADD_ACTIVITY = 'ADD_ACTIVITY';

export function addActivity(activity) {
  return {
    type: ADD_ACTIVITY,
    activity
  }
}

export const REMOVE_ACTIVITY = 'REMOVE_ACTIVITY';

export function removeActivity(id) {
  return {
    type: REMOVE_ACTIVITY,
    id
  }
}
