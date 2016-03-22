import { SCREEN } from './screens.js';
import network from './network.js';

// TODO: Refactor to somewhere else
let validateNewActivity = function (activity) {
  // TODO: Validate values of the properties
  // TODO: Validate client generated ones separately to server given ones
  let properties = ['max_attendees', 'description', 'start_time', 'title', 'location'];
  let hasProperties = properties.reduce(function(previous, property) {
    return (previous && activity.hasOwnProperty(property));
  }, true);
  if (!hasProperties) {
    return {isValid: false, reason: 'some properties were missing'};
  }
  if (activity.title == '') {
    return {isValid: false, reason: 'missing title'};
  }
  if (!activity.start_time || !(activity.start_time instanceof Date)) {
    return {isValid: false, reason: 'start_time wasnt a date object or was missing'};
  }
  if (activity.start_time && activity.start_time instanceof Date) {
    // Allow users to see and edit events up to 2 hours in the past
    let now = new Date;
    now = now.add(-2).hours();
    if (activity.start_time < now) {
      return {isValid: false, reason: 'date (' + activity.start_time.toString() + ') was in the past'};
    }
  }
  return {isValid: true};
};

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

export const GOTO_CREATE_SCREEN = 'GOTO_CREATE_SCREEN';

export function gotoCreateScreen() {
  return {
    type: GOTO_CREATE_SCREEN,
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

export const LOGIN = 'LOGIN';

// This is a Redux Thunk, it is async and dispatches other events
// TODO: Handle failure here
export function login(fbToken) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      network.requestLogin(fbToken).then(({userId, userName, sessionToken}) => {


        console.log(userId, userName, sessionToken);
        dispatch(setUser(userId, userName, sessionToken));
        resolve({userId, sessionToken});
      });
    });
  }
};

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

/* Activities thunks */

export function requestSetAttending(userId, sessionToken, activity, attending) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      network.requestSetAttending({userId, sessionToken}, activity, attending, function (updatedActivity) {
        // TODO: support updating instead of removing as right now you can select an activity which will get removed and re-added
        dispatch(removeActivity(activity.id));
        dispatch(addActivity(updatedActivity));
        resolve();
      }, reject);
    })
  }
};

export function requestRefreshActivities(userId, sessionToken) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      network.requestActivitiesFromServer({userId, sessionToken}, (activities) => {
        for (let i = 0; i < activities.length; i++) {
          let activity = activities[i];
          dispatch(addActivity(activity));
        }
        resolve();
      }, reject);
    });
  }
}

export function requestCreateActivity(userId, sessionToken, newActivity) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      let validity = validateNewActivity(newActivity);
      if (validity.isValid) {
        network.requestCreateActivity({userId, sessionToken}, newActivity, (updatedActivity) => {
          dispatch(addActivity(updatedActivity));
          resolve();
        }, reject);
      } else {
        console.log('activity wasn\'t valid because '+validity.reason, newActivity);
      }
    })
  }
};

export function requestUpdateActivity(userId, sessionToken, activity, activityChanges) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      network.requestUpdateActivity({userId, sessionToken}, activity, activityChanges, (updatedActivity) => {
        dispatch(removeActivity(activity.id));
        dispatch(addActivity(updatedActivity));
        resolve();
      }, reject);
    })
  };
}

export function requestDeleteActivity(userId, sessionToken, activity) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      network.requestCancelActivity({userId, sessionToken}, activity, (updatedActivity) => {
        dispatch(removeActivity(activity.id));
        resolve();
      }, reject);
    })
  };
}
