// Require react, convenience libraries and UI components
'use strict';

var React = require('react');
var m = require('./m.js');
var ActivityCard = require('./activity-card.js');

// Require core logic
var models = require('./models.js');

var ActivityCardList = React.createClass({
  displayName: 'ActivityCardList',

  getInitialState: function getInitialState() {
    return {
      selectedActivity: undefined
    };
  },

  render: function render() {
    var _this = this;

    var activitiesList = models.activities.getActivities().map(function (activity) {
      return React.createElement(ActivityCard, {
        activity: activity,
        onClick: _this.handleActivityClick,
        onAttendClick: _this.handleAttendClick,
        onUnattendClick: _this.handleUnattendClick,
        onEditClick: _this.handleEditClick,
        selected: !!_this.state.selectedActivity && _this.state.selectedActivity.id == activity.id,
        key: activity.id
      });
    });
    return React.createElement(
      'div',
      null,
      activitiesList
    );
  },

  handleActivityClick: function handleActivityClick(activity) {
    // If something is selected, and it's the activity clicked...
    if (this.state.selectedActivity && this.state.selectedActivity.id == activity.id) {
      this.setState({ selectedActivity: undefined });
    } else {
      this.setState({ selectedActivity: activity });
    }
  },

  handleEditClick: function handleEditClick(activity) {
    this.props.onEditClick(activity);
  },

  handleAttendClick: function handleAttendClick(activity) {
    this.props.onAttendClick(activity);
  },

  handleUnattendClick: function handleUnattendClick(activity) {
    this.props.onUnattendClick(activity);
  }

});

module.exports = ActivityCardList;
