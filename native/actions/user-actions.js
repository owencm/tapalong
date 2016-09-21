import { SET_USER } from '../constants/action-types.js'
import { requestRefreshActivities } from './activity-actions.js'
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
        dispatch(requestRefreshActivities(userId, sessionToken))
        return { userId, userName, sessionToken, thumbnail }
      })
  }
}
