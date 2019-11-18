import { SET_USER } from '../constants/action-types.js'
import { requestRefreshPlans } from './plan-actions.js'
import { requestRefreshEvents } from './event-actions.js'
import network from '../network.js';

export function setUser(userId, userName, sessionToken, thumbnail) {
  return {
    type: SET_USER,
    userId,
    userName,
    sessionToken,
    thumbnail,
  }
}

// This is a Redux Thunk, it is async and dispatches other events
// TODO: Handle failure here
export function login(fbToken) {
  return (dispatch) => {
    return network.requestLogin(fbToken)
      .then(({ userId, userName, sessionToken, thumbnail }) => {
        dispatch(setUser(userId, userName, sessionToken, thumbnail))
        dispatch(requestRefreshPlans(userId, sessionToken))
        dispatch(requestRefreshEvents(userId, sessionToken))
        return { userId, userName, sessionToken, thumbnail }
      }).catch((e) => { throw e })
  }
}

export function requestCreatePushNotificationsSubscription(user, sessionToken) {
  return (dispatch) => {
    return network.requestCreatePushNotificationsSubscription(user, sessionToken)
  }
}

export function requestBlockUser(userId, sessionToken, userToBlockId) {
  return (dispatch) => {
    return network.requestBlockUser({userId, sessionToken}, userToBlockId)
      .then(() => {
        dispatch(requestRefreshPlans(userId, sessionToken))
        alert('This user has been blocked. You will no longer see their plans, and they will not be able to see yours.')
    }).catch((e) => { throw e })
  }
}
