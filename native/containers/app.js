/*

  A container that maps Redux store state to props for the app component, and
  passes nice callbacks as props that eventually trigger dispatch to update
  the store

*/

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import App from '../components/app.js'
import * as Actions from '../actions.js'

function mapStateToProps(state) {
  return {
    user: state.user,
    activities: state.activities,
    screens: state.screens
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(Actions, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
