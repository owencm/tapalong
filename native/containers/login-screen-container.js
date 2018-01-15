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
import { AsyncStorage } from 'react-native'

// Debug code for logging out the user
// AsyncStorage.removeItem('user')

const mapStateToProps = (state) => {
  return {
    // So the login screen can auto-navigate to list if the user is not undefined
    user: state.user
  }
}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({
    login: actions.login,
    setUser: actions.setUser,
    requestRefreshPlans: actions.requestRefreshPlans,
    requestRefreshEvents: actions.requestRefreshEvents,
  }, dispatch)
}

class LoginScreenContainer extends React.Component {
  componentWillMount() {
    // Temporary hack to restore the current user upon app restart
    AsyncStorage.getItem('user')
      .then((user) => {
        return JSON.parse(user) || this.props.user || {}
      }).then((user) => {
        // console.log('stored user', user)
        if (user.userId > 0) {
          this.props.setUser(user.userId, user.userName, user.sessionToken, user.thumbnail)
          setTimeout(() => {
            this.props.requestRefreshPlans(user.userId, user.sessionToken)
            this.props.requestRefreshEvents(user.userId, user.sessionToken)
            this.props.navigation.navigate('List')
          }, 100)
        }
      })
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
