import React, { Component } from 'react'
import { connect } from 'react-redux'
import actions from '../actions/index.js'
import EditScreen from '../components/edit-screen.js'
import {
  View,
  Text,
} from 'react-native'

const mapStateToProps = (state) => {
  return {
    user: state.user
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    requestDeletePlan: actions.requestDeletePlan,
    requestUpdatePlan: actions.requestUpdatePlan,
  }
}

class EditScreenContainer extends React.Component {
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
    const params = this.props.navigation.state.params || {}
    return (
      <EditScreen
        plan={ params.plan || undefined }
        userName={ this.props.user.userName }
        onSaveClick={ this.handleSavePlan }
        onDeleteClick={ this.handleDeletePlan }
        creating={ false }
      />
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(EditScreenContainer)
