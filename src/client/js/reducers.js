import m from './m.js';
import { SCREEN } from './screens.js';
import persistence from './persistence.js';

import {
  GOTO_SCREEN, GOTO_EDIT_SCREEN, GOTO_CREATE_SCREEN,
  GOTO_NEXT_SCREEN, QUEUE_NEXT_SCREEN,
  SET_USER, ADD_ACTIVITY, REMOVE_ACTIVITY
} from './actions.js'

// TODO: Refactor to somewhere else
let validateNewActivity = function (activity) {
  // TODO: Validate values of the properties
  // TODO: Validate client generated ones separately to server given ones
  let properties = ['description', 'startTime', 'title'];
  let hasProperties = properties.reduce(function(previous, property) {
    return (previous && activity.hasOwnProperty(property));
  }, true);
  if (!hasProperties) {
    return {isValid: false, reason: 'some properties were missing'};
  }
  if (activity.title == '') {
    return {isValid: false, reason: 'missing title'};
  }
  if (!activity.startTime || !(activity.startTime instanceof Date)) {
    return {isValid: false, reason: 'startTime wasnt a date object or was missing'};
  }
  if (activity.startTime && activity.startTime instanceof Date) {
    // Allow users to see and edit events up to 2 hours in the past
    let now = new Date;
    now = now.add(-2).hours();
    if (activity.startTime < now) {
      return {isValid: false, reason: 'date (' + activity.startTime.toString() + ') was in the past'};
    }
  }
  return {isValid: true};
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

export function user(state = {}, action) {
  switch (action.type) {
    case SET_USER:
      let newUser = {
        userId: action.userId,
        userName: action.userName,
        sessionToken: action.sessionToken
      };
      persistence.setUser(newUser);
      return m({}, state, newUser);
    default:
      return state;
  }
};

export function activities(state = {
  activities: [],
  maxActivityId: 0
}, action) {
  switch (action.type) {
    case ADD_ACTIVITY:
      let validity = validateNewActivity(action.activity);
      if (!validity.isValid) {
        console.log('Invalid activity attempted to be added: '+validity.reason);
        return state;
      }
      return Object.assign({}, state,
        {
          activities: [...state.activities,
            Object.assign({}, action.activity, { clientId: state.maxActivityId })
          ].sort((a, b) => { return a.startTime < b.startTime ? -1 : 1 }),
          maxActivityId: state.maxActivityId + 1
        }
      );
    case REMOVE_ACTIVITY:
    return Object.assign({}, state,
      {
        activities: [...state.activities].filter((activity) => {
          return activity.clientId !== action.clientId;
        })
      }
    );
    default:
      return state;
    }
  }
