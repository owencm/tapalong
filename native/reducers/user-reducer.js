import { SET_USER } from '../constants/action-types.js'
import { AsyncStorage } from 'react-native'
import m from '../m.js'

// TODO: Read this out of storage
// TODO: Handle the session token expiring
const initialState = {
  // userId: '1',
  // userName: 'Owen Campbell-Moore',
  // sessionToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjEsImlhdCI6MTQ3Mzk5Mzg5NCwiZXhwIjoxNDgxNzY5ODk0fQ.innhI4FFRJBcaV_dPP7RBfB0GWCXxE82yy7L23hEw2A'
}

const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_USER:
      const newUser = {
        userId: action.userId,
        userName: action.userName,
        sessionToken: action.sessionToken
      };
      // HACKS to restore previously logged in user
      AsyncStorage.setItem('user', JSON.stringify(newUser))
      return m({}, state, newUser);
    default:
      return state;
  }
};

export default userReducer
