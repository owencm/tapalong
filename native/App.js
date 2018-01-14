/*

  Set up Redux store and pass it to the app container

  Temporarily also log the user in and download the new plans

*/

import React from 'react'
import { Provider, connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import configureStore from './store/configure-store.js'
import NavRoot from './components/nav-root.js'
import actions from './actions/index.js'

const store = configureStore()

const mapStateToProps = (state) => {
  return {
    user: state.user,
    plans: state.plans,
    nav: state.nav,
    butterBar: state.butterBar,
    events: state.events,
  }
}

const mapDispatchToProps = (dispatch) => bindActionCreators(actions, dispatch)

// ES6 class used as registerComponent does not support stateless components
export default class App extends React.Component {
  render() {
    return (
      <Provider store={store}>
        {connect(mapStateToProps, mapDispatchToProps)(NavRoot)}
      </Provider>
    )
  }
}
