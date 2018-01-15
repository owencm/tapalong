import React, { Component } from 'react'
import { connect } from 'react-redux'
import actions from '../actions/index.js'
import ListScreen from '../components/list-screen.js'
import {
  View,
  Text,
} from 'react-native'

const mapStateToProps = (state) => {
  return {
    user: state.user,
    plans: state.plans,
    events: state.events,
    butterBar: state.butterBar,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    requestRefreshPlans: actions.requestRefreshPlans,
    requestRefreshEvents: actions.requestRefreshEvents,
    requestSetAttending: actions.requestSetAttending,
    expandPlan: actions.expandPlan,
    unexpandPlan: actions.unexpandPlan,
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
      <ListScreen
        gotoEditPlanScreen={ (plan) => this.props.navigation.navigate('Edit', { plan }) }
        gotoCreatePlanScreen={ () => { this.props.navigation.navigate('Edit') } }
        onAttendPlan={ this.handleAttendPlan }
        onUnattendPlan={ this.handleUnattendPlan }
        style={{ flex: 1 }}
        {...this.props}
      />
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ListScreenContainer)
