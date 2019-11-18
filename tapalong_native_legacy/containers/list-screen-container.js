import React, { Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import actions from '../actions/index.js'
import ListScreen from '../components/list-screen.js'
import If from '../components/if.js'
import {
  View,
  Text,
  Alert,
  SafeAreaView,
  AppState,
} from 'react-native'
import { Permissions, Notifications, Audio } from 'expo'
import { NavigationActions } from 'react-navigation'

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
    requestReportPlan: actions.requestReportPlan,
    requestBlockUser: actions.requestBlockUser,
    requestRefreshPlans: actions.requestRefreshPlans,
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

const soundObject = new Audio.Sound()
soundObject.loadAsync(require('../assets/sounds/success-1.m4a'))

class ListScreenContainer extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      refreshing: false
    }
  }

  _appState = AppState.currentState
  _handleAppStateChange = (nextAppState) => {
    // alert(this._appState)
    if (this._appState.match(/inactive|background/) && nextAppState === 'active') {
      // App has come into foreground
      this.handleRefresh()
    }
    this._appState = nextAppState
  }


  componentDidMount() {
    AppState.addEventListener('change', this._handleAppStateChange);
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this._handleAppStateChange);
  }

  handleAttendPlan(plan) {
    const { userId, sessionToken } = this.props.user;
    this.props.requestSetAttending(userId, sessionToken, plan, !plan.isAttending)
    soundObject.playFromPositionAsync(0)
  }

  handleUnattendPlan(plan) {
    const { userId, sessionToken } = this.props.user;
    this.props.requestSetAttending(userId, sessionToken, plan, !plan.isAttending)
  }

  handleReportPlan(plan) {
    Alert.alert(
      'Confirm',
      'Are you sure you want to report this content?',
      [
        {text: 'Cancel', onPress: () => {  }, style: 'cancel'},
        {text: 'Report', onPress: () => {
          const { userId, sessionToken } = this.props.user;
          this.props.requestReportPlan(userId, sessionToken, plan)
        }, style: 'destructive'},
      ]
    )
  }

  handleBlockUser(userToBlockId) {
    Alert.alert(
      'Confirm',
      'Are you sure you want to block this user? This action cannot be undone.',
      [
        {text: 'Cancel', onPress: () => {  }, style: 'cancel'},
        {text: 'Block', onPress: () => {
          const { userId, sessionToken } = this.props.user;
          this.props.requestBlockUser(userId, sessionToken, userToBlockId)
        }, style: 'destructive'},
      ]
    )
  }

  handleRefresh() {
    // TODO: migrate this into Redux so any refresh triggers it
    this.setState({ refreshing: true })
    const { userId, sessionToken } = this.props.user
    this.props.requestRefreshPlans(userId, sessionToken).then(() => {
      this.setState({ refreshing: false })
    })
  }

  render () {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <View style={{ flex: 1, backgroundColor: '#eaeaea' }}>
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
            onReportPlan={ this.handleReportPlan.bind(this) }
            onBlockUser={ this.handleBlockUser.bind(this) }
            onRefresh={ this.handleRefresh.bind(this) }
            refreshing={ this.state.refreshing }
            style={{ flex: 1 }}
            {...this.props}
          />
        </View>
      </SafeAreaView>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ListScreenContainer)
