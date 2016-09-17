/*

  Set up Redux store and pass it to the app container

  Temporarily also log the user in and download the new activities

*/


import React, { Component } from 'react'
import { AppRegistry } from 'react-native'
import { Provider } from 'react-redux'
import App from './containers/app.js'
import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import { screens, user, activities } from './reducers.js'
import {
  requestRefreshActivities,
  setUser,
  gotoScreen,
} from './actions.js'

const createStoreWithMiddleware = applyMiddleware(
  thunk
)(createStore);

const store = createStoreWithMiddleware(combineReducers({screens, user, activities}));

// To ease debugging, output state whenever it changes
store.subscribe(() => console.log(store.getState()))

// I'm not sure where this code should go. Before the app boots up it checks
//   whether the user is logged in and sets up the screens
// TODO: Handle the session token expiring
const userId = '1'
const sessionToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjEsImlhdCI6MTQ3Mzk5Mzg5NCwiZXhwIjoxNDgxNzY5ODk0fQ.innhI4FFRJBcaV_dPP7RBfB0GWCXxE82yy7L23hEw2A'
store.dispatch(setUser('Owen Campbell-Moore', userId, sessionToken))
store.dispatch(requestRefreshActivities(userId, sessionToken))
store.dispatch(gotoScreen(1))

class Tapalong extends Component {
  render() {
    return (
      <Provider store={store}>
        <App />
      </Provider>
    )
  }
}

AppRegistry.registerComponent('Tapalong', () => Tapalong)
