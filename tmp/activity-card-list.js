// Require react, convenience libraries and UI components
'use strict';

var React = require('react');
var m = require('./m.js');
var ActivityCard = require('./activity-card.js');

// Require core logic
var models = require('./models.js');

var ActivityCardList = React.createClass({
  displayName: 'ActivityCardList',

  handleSelected: function handleSelected(activity) {
    this.props.onActivitySelected(activity);
  },
  handleUnselected: function handleUnselected(activity) {
    this.props.onActivityUnselected(activity);
  },
  handleEditClicked: function handleEditClicked() {
    this.props.onEditModeEnabled();
  },
  handleAttendClicked: function handleAttendClicked(activity) {
    this.props.onAttendClicked(activity);
  },
  render: function render() {
    var activitiesList = models.activities.getActivities().map((function (activity) {
      return React.createElement(ActivityCard, {
        activity: activity,
        onActivitySelected: this.handleSelected,
        onActivityUnselected: this.handleUnselected,
        onAttendClicked: this.handleAttendClicked,
        onEditClicked: this.handleEditClicked,
        selected: this.props.selectedActivity && this.props.selectedActivity.id == activity.id,
        key: activity.id
      });
    }).bind(this));
    return React.createElement(
      'div',
      null,
      activitiesList
    );
  }
});

module.exports = ActivityCardList;
