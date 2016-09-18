import React from 'react'
import m from '../m.js'
import { ScrollView } from 'react-native'
import ActivityCard from './activity-card.js'

let ActivityCardList = React.createClass({

  getInitialState: function () {
    return {
      selectedActivity: undefined
    }
  },

  render: function () {
    const activitiesList = this.props.activities.map((activity) => {
      return (
        <ActivityCard
          activity = { activity }
          onClick = { this.handleActivityClick }
          onAttendClick = { this.handleAttendClick }
          onUnattendClick = { this.handleUnattendClick }
          onEditClick = { this.handleEditClick }
          selected = {
            !!this.state.selectedActivity &&
            this.state.selectedActivity.clientId == activity.clientId
          }
          key = { activity.clientId }
        />
      );
    });
    return (
      <ScrollView style={{ flex: 1 }}>
        { activitiesList }
      </ScrollView>
    );
  },

  handleActivityClick: function (activity) {
    // If something is selected, and it's the activity clicked...
    if (this.state.selectedActivity &&
        this.state.selectedActivity.clientId == activity.clientId) {
      this.setState({selectedActivity: undefined});
    } else {
      this.setState({selectedActivity: activity});
    }
  },

  handleEditClick: function (activity) {
    this.props.onEditClick(activity);
  },

  handleAttendClick: function (activity) {
    this.props.onAttendClick(activity);
  },

  handleUnattendClick: function (activity) {
    this.props.onUnattendClick(activity);
  }

});

module.exports = ActivityCardList;
