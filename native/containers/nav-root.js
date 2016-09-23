/*

  A container that maps Redux store state to props for the app component, and
  passes nice callbacks as props that eventually trigger dispatch to update
  the store

*/

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import NavRoot from '../components/nav-root.js'
import actions from '../actions/index.js'

function mapStateToProps(state) {
  return {
    user: state.user,
    plans: state.plans,
    nav: state.nav,
    butterBar: state.butterBar,
    events: state.events,
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(actions, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(NavRoot)
