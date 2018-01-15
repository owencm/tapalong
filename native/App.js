import React from 'react'
import { AppRegistry } from 'react-native'
import { Provider } from 'react-redux'
import NavContainer from './containers/nav-container.js'
import configureStore from './store/configure-store.js'

const store = configureStore()

// ES6 class used as registerComponent does not support stateless components
export default class App extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <NavContainer />
      </Provider>
    )
  }
}
