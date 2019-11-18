import React from 'react'
import { StatusBar, View, Platform } from 'react-native'
import { Provider } from 'react-redux'
import NavContainer from './containers/nav-container.js'
import configureStore from './store/configure-store.js'
import Sentry from 'sentry-expo'

if (Platform.OS === 'ios') {
  // Remove this once Sentry is correctly setup.
  Sentry.enableInExpoDevelopment = true
  Sentry.config('https://2fb02cb6bb7b4c2897a4ac3291da4e05@sentry.io/272148').install()
}

const store = configureStore()

// ES6 class used as registerComponent does not support stateless components
export default class App extends React.Component {
  render() {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar
          barStyle="dark-content"
        />
        <Provider store={store}>
          <NavContainer />
        </Provider>
      </View>
    )
  }
}
