import {
  ADD_ACTIVITY,
  REMOVE_ACTIVITY,
  MARK_ACTIVITIES_INITIALIZED,
} from '../constants/action-types.js'

import network from '../network.js'
import validateActivity from '../lib/validate-activity.js'

/* Activities actions */

export function addActivity(activity) {
  return {
    type: ADD_ACTIVITY,
    activity
  }
}

export function removeActivity(clientId) {
  return {
    type: REMOVE_ACTIVITY,
    clientId
  }
}

export function markActivitiesInitialized() {
  return {
    type: MARK_ACTIVITIES_INITIALIZED,
  }
}

/* Activities thunks */

// Todo: why do these take session tokens and user ids?

export function requestSetAttending(userId, sessionToken, activity, attending) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      network.requestSetAttending({userId, sessionToken}, activity, attending, function (updatedActivity) {
        // TODO: support updating instead of removing as right now you can select an activity which will get removed and re-added
        dispatch(removeActivity(activity.clientId));
        dispatch(addActivity(updatedActivity));
        resolve();
      }, reject);
    })
  }
};

export function requestRefreshActivities(userId, sessionToken) {
  return (dispatch) => {
    dispatch(markActivitiesInitialized())
    return new Promise((resolve, reject) => {
      network.requestActivitiesFromServer({userId, sessionToken}, (activities) => {
        for (let i = 0; i < activities.length; i++) {
          const activity = activities[i]
          dispatch(addActivity(activity))
        }
        resolve();
      }, reject);
    });
  }
}

export function requestCreateActivity(userId, sessionToken, newActivity) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      let validity = validateActivity(newActivity);
      if (validity.isValid) {
        network.requestCreateActivity({userId, sessionToken}, newActivity, (updatedActivity) => {
          dispatch(addActivity(updatedActivity));
          resolve();
        }, reject);
      } else {
        alert(`Error: ${validity.reason}. Please refresh and try again`);
        console.log('activity wasn\'t valid because '+validity.reason, newActivity);
      }
    })
  }
};

// TODO: Implement client side validity checking
export function requestUpdateActivity(userId, sessionToken, activity, activityChanges) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      network.requestUpdateActivity({userId, sessionToken}, activity, activityChanges, (updatedActivity) => {
        dispatch(removeActivity(activity.clientId));
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
        dispatch(removeActivity(activity.clientId));
        resolve();
      }, reject);
    })
  };
}
