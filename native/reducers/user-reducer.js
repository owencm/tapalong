import { SET_USER } from '../constants/action-types.js'
import { AsyncStorage } from 'react-native'
import m from '../m.js'

const initialState = {}

// AsyncStorage.removeItem('user')

// TODO: Handle the session token expiring
// const initialState = {
//   userId: '1',
//   userName: 'Owen Campbell-Moore',
//   sessionToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjEsImlhdCI6MTUxNTk3NjI1OCwiZXhwIjoxNTIzNzUyMjU4fQ.G_pQyIF3JI7TtpckKwZKOV3T81uC9NGJZCpZ3OlR754',
//   thumbnail: 'https://graph.facebook.com/680160262/picture'
//   //
//   // sessionToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjMsImlhdCI6MTUxNjAwMDY0OCwiZXhwIjoxNTIzNzc2NjQ4fQ.W5xvaQeK_oBJgn78zaXk3KB6rR0cq-EORLJXMdKxAdc",
//   // thumbnail: "https://graph.facebook.com/103098120050863/picture",
//   // userId: 3,
//   // userName: "Ruth Smith",
//
//   // sessionToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjUsImlhdCI6MTUxNjAwMDc4NywiZXhwIjoxNTIzNzc2Nzg3fQ.shQoRxmYq76w4BtuOn8x84DVJoIidYw88JhtaSOhrUw",
//   // thumbnail: "https://graph.facebook.com/148189975539520/picture",
//   // userId: 5,
//   // userName: "Richard Sadanson",
// }
// AsyncStorage.setItem('user', JSON.stringify(initialState))

const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_USER:
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
