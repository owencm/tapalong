/*

  Set up Redux store and pass it to the app container

  Temporarily also log the user in and download the new activities

*/

import React from 'react'
import { AppRegistry } from 'react-native'
import { Provider } from 'react-redux'
import NavRoot from './containers/nav-root.js'
import configureStore from './store/configure-store.js'

const store = configureStore()

// ES6 class used as registerComponent does not support stateless components
class Tapalong extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <NavRoot />
      </Provider>
    )
  }
}

AppRegistry.registerComponent('Tapalong', () => Tapalong)
