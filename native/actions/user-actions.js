import { SET_USER } from '../constants/action-types.js'
import network from '../network.js';

export function setUser(userId, userName, sessionToken) {
  return {
    type: SET_USER,
    userId,
    userName,
    sessionToken
  }
}

// This is a Redux Thunk, it is async and dispatches other events
// TODO: Handle failure here
export function login(fbToken) {
  return (dispatch) => {
    return network.requestLogin(fbToken)
      .then(({userId, userName, sessionToken}) => {
        dispatch(setUser(userId, userName, sessionToken))
        return {userId, userName, sessionToken}
      })
  }
}
