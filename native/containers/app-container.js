/*
  A container that maps Redux store state to props for the app component, and
  passes nice callbacks as props that eventually trigger dispatch to update
  the store
*/

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import NavContainer from './nav-container.js'
import actions from '../actions/index.js'

const mapStateToProps = (state) => {
  return {
    user: state.user,
    plans: state.plans,
    butterBar: state.butterBar,
    events: state.events,
  }
}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(actions, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(NavContainer)
