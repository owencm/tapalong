import {
  ADD_ACTIVITY,
  REMOVE_ACTIVITY,
  EXPAND_ACTIVITY,
  UNEXPAND_ACTIVITY,
  UPDATE_ACTIVITY,
} from '../constants/action-types.js'

import network from '../network.js'
import validateActivity from '../lib/validate-activity.js'

/* Activities actions */

export function addActivity(activity) {
  return {
    type: ADD_ACTIVITY,
    activity,
  }
}

export function removeActivity(clientId) {
  return {
    type: REMOVE_ACTIVITY,
    clientId,
  }
}

export function updateActivity(clientId, activity) {
  return {
    type: UPDATE_ACTIVITY,
    clientId,
    activity,
  }
}

export function expandActivity(activity) {
  return {
    type: EXPAND_ACTIVITY,
    activity,
  }
}

export function unexpandActivity(activity) {
  return {
    type: UNEXPAND_ACTIVITY,
    activity,
  }
}

/* Activities thunks */

// Todo: why do these take session tokens and user ids?

export function requestSetAttending(userId, sessionToken, activity, attending) {
  return (dispatch) => {
    // This is the poor man's optimistic UI. We dispatch an update and mark
    //   it as pending and then replace with the real activity when we get it
    //   back from the server
    const optimisticActivity = Object.assign({}, activity, { isAttending: attending, pending: true })
    dispatch(updateActivity(activity.clientId, optimisticActivity))
    return network.requestSetAttending({userId, sessionToken}, activity, attending)
      .then((updatedActivity) => {
        dispatch(updateActivity(activity.clientId, updatedActivity));
      })
  }
};

export function requestRefreshActivities(userId, sessionToken) {
  return (dispatch) => {
    return network.requestActivitiesFromServer({userId, sessionToken}).then((activities) => {
      for (let i = 0; i < activities.length; i++) {
        const activity = activities[i]
        dispatch(addActivity(activity))
      }
    })
  }
}

export function requestCreateActivity(userId, sessionToken, newActivity) {
  return (dispatch) => {
    const validity = validateActivity(newActivity);
    if (validity.isValid) {
      return network.requestCreateActivity({userId, sessionToken}, newActivity)
        .then((updatedActivity) => {
          dispatch(addActivity(updatedActivity))
        })
    } else {
      alert(`Error: ${validity.reason}. Please refresh and try again`);
      console.log('activity wasn\'t valid because '+validity.reason, newActivity);
    }
  }
}

// TODO: Implement client side validity checking
export function requestUpdateActivity(userId, sessionToken, activity, activityChanges) {
  return (dispatch) => {
    return network.requestUpdateActivity({userId, sessionToken}, activity, activityChanges)
      .then((updatedActivity) => {
        dispatch(removeActivity(activity.clientId));
        dispatch(addActivity(updatedActivity));
      })
  }
}

export function requestDeleteActivity(userId, sessionToken, activity) {
  return (dispatch) => {
    return network.requestCancelActivity({userId, sessionToken}, activity)
      .then((updatedActivity) => {
        dispatch(removeActivity(activity.clientId));
      })
  }
}
