import { SET_USER } from '../constants/action-types.js'
import { AsyncStorage } from 'react-native'
import m from '../m.js'

// TODO: Read this out of storage
// TODO: Handle the session token expiring
const initialState = {
  userId: '1',
  userName: 'Owen Campbell-Moore',
  sessionToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjEsImlhdCI6MTUxNTk3NjI1OCwiZXhwIjoxNTIzNzUyMjU4fQ.G_pQyIF3JI7TtpckKwZKOV3T81uC9NGJZCpZ3OlR754',
  thumbnail: 'https://graph.facebook.com/680160262/picture'
}

const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_USER:
    console.log(action)
      const newUser = {
        userId: action.userId,
        userName: action.userName,
        sessionToken: action.sessionToken,
        thumbnail: action.thumbnail,
      };
      // HACKS to restore previously logged in user
      AsyncStorage.setItem('user', JSON.stringify(newUser))
      return m({}, state, newUser);
    default:
      return state;
  }
};

export default userReducer
