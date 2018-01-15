import React, { Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import actions from '../actions/index.js'
import ListScreen from '../components/list-screen.js'
import If from '../components/if.js'
import {
  View,
  Text,
} from 'react-native'
import { Permissions, Notifications } from 'expo';

const mapStateToProps = (state) => {
  return {
    user: state.user,
    plans: state.plans,
    events: state.events,
    butterBar: state.butterBar,
  }
}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({
    requestRefreshPlans: actions.requestRefreshPlans,
    requestRefreshEvents: actions.requestRefreshEvents,
    requestSetAttending: actions.requestSetAttending,
    requestCreatePushNotificationsSubscription: actions.requestCreatePushNotificationsSubscription,
    expandPlan: actions.expandPlan,
    unexpandPlan: actions.unexpandPlan,
  }, dispatch)
}

class PushSubscriber extends React.Component {
  async registerForPushNotificationsAsync() {
    const { status: existingStatus } = await Permissions.getAsync(
      Permissions.NOTIFICATIONS
    )
    let finalStatus = existingStatus

    // only ask if permissions have not already been determined, because
    // iOS won't necessarily prompt the user a second time.
    if (existingStatus !== 'granted') {
      // Android remote notification permissions are granted during the app
      // install, so this will only ask on iOS
      const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS)
      finalStatus = status
    }

    // Stop here if the user did not grant permissions
    if (finalStatus !== 'granted') {
      // alert('Couldn\'t get push token')
      return
    }

    // Get the token that uniquely identifies this device
    let token = await Notifications.getExpoPushTokenAsync()
    this.props.requestCreatePushNotificationsSubscription(this.props.user, token)
  }
  componentDidMount() {
    this.registerForPushNotificationsAsync()
  }
  render() {
    return null
  }
}

class ListScreenContainer extends React.Component {
  handleAttendPlan(plan) {
    const { userId, sessionToken } = this.props.user;
    this.props.requestSetAttending(userId, sessionToken, plan, !plan.isAttending)
  }

  handleUnattendPlan(plan) {
    const { userId, sessionToken } = this.props.user;
    this.props.requestSetAttending(userId, sessionToken, plan, !plan.isAttending)
  }

  render () {
    return (
      <View style={{ flex: 1 }}>
        <If condition={ this.props.user.userId > -1 }>
          <PushSubscriber {...this.props} />
        </If>
        <ListScreen
          gotoEditPlanScreen={ (plan) => this.props.navigation.navigate('Edit', { plan }) }
          gotoCreatePlanScreen={ (planTemplate) => { this.props.navigation.navigate('Edit', { planTemplate: planTemplate } ) } }
          onAttendPlan={ this.handleAttendPlan.bind(this) }
          onUnattendPlan={ this.handleUnattendPlan.bind(this) }
          onExpandPlan={ this.props.expandPlan }
          onUnexpandPlan={ this.props.unexpandPlan }
          style={{ flex: 1 }}
          {...this.props}
        />
      </View>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ListScreenContainer)
