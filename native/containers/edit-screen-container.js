import React, { Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
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
  return bindActionCreators({
    requestDeletePlan: actions.requestDeletePlan,
    requestUpdatePlan: actions.requestUpdatePlan,
    requestCreatePlan: actions.requestCreatePlan,
  }, dispatch)
}

class EditScreenContainer extends React.Component {
  handleSavePlan(plan, planChanges) {
    const { userId, sessionToken } = this.props.user
    return this.props.requestUpdatePlan(userId, sessionToken, plan, planChanges).then(() => {
      this.props.navigation.goBack(null)
    })
  }

  handleCreatePlan(plan) {
    const { userId, sessionToken } = this.props.user
    return this.props.requestCreatePlan(userId, sessionToken, plan).then(() => {
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
        plan={ params.plan || params.planTemplate || undefined }
        userName={ this.props.user.userName }
        onSaveClick={ this.handleSavePlan.bind(this) }
        onCreateClick={ this.handleCreatePlan.bind(this) }
        onDeleteClick={ this.handleDeletePlan.bind(this) }
        creating={ !(this.props.navigation.state.params && (this.props.navigation.state.params.plan !== undefined)) }
      />
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(EditScreenContainer)
