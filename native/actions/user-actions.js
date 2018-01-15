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
  console.log("attempting to login to app server")
  return (dispatch) => {
    console.log('thunk called with dispatch', dispatch)
    return network.requestLogin(fbToken)
      .then(({ userId, userName, sessionToken, thumbnail }) => {
        console.log('Login thunk complete', userId, userName, sessionToken, thumbnail)
        dispatch(setUser(userId, userName, sessionToken, thumbnail))
        dispatch(requestRefreshPlans(userId, sessionToken))
        dispatch(requestRefreshEvents(userId, sessionToken))
        return { userId, userName, sessionToken, thumbnail }
      }).catch((e) => { throw e })
  }
}
