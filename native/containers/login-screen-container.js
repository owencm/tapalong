import React, { Component } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import actions from '../actions/index.js'
import LoginScreen from '../components/login-screen.js'
import {
  View,
  Text,
} from 'react-native'

// Temporary hacks to remember auth until I implement redux-persist
// import { AsyncStorage } from 'react-native'

// Debug code for logging out the user
// const clearUser = false
// if (clearUser) { AsyncStorage.removeItem('user') }
//
// const getUser = () => {
//   return AsyncStorage.getItem('user')
//     .then((user) => { return JSON.parse(user) || {} })
// }

// if (!init) {
//   init = true
//
//       props.requestRefreshPlans(user.userId, user.sessionToken)
//       props.requestRefreshEvents(user.userId, user.sessionToken)
//     }
//   })



const mapStateToProps = (state) => {
  return {
    // So the login screen can auto-navigate to list if the user is not undefined
    user: state.user
  }
}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({
    login: actions.login,
    requestRefreshPlans: actions.requestRefreshPlans,
    requestRefreshEvents: actions.requestRefreshEvents,
  }, dispatch)
}

class LoginScreenContainer extends React.Component {
  componentWillMount() {
    const user = this.props.user
    if (user.userId > 0) {
      this.props.requestRefreshPlans(user.userId, user.sessionToken)
      this.props.requestRefreshEvents(user.userId, user.sessionToken)
      this.props.navigation.navigate('List')
    }
  }

  handleSavePlan(plan, planChanges) {
    const { userId, sessionToken } = this.props.user
    return this.props.requestUpdatePlan(userId, sessionToken, plan, planChanges).then(() => {
      this.props.navigation.goBack(null)
    })
  }

  handleDeletePlan(plan) {
    const { userId, sessionToken } = this.props.user
    return this.props.requestDeletePlan(userId, sessionToken, plan).then(() => {
      this.props.navigation.goBack(null)
    })
  }

  render () {
    return (
      <LoginScreen
        // onLoginDismissed={ () => { this.props.navigation.navigate('List') } }
        onLoginComplete={ (fbToken) => {
          this.props.login(fbToken)
          this.props.navigation.navigate('List')
        }}
      />
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(LoginScreenContainer)
