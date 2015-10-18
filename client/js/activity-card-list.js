// Require react, convenience libraries and UI components
var React = require('react');
var m = require('./m.js');
var ActivityCard = require('./activity-card.js');

// Require core logic
var models = require('./models.js');

var ActivityCardList = React.createClass({
  handleSelected: function (activity) {
    this.props.onActivitySelected(activity);
  },
  handleUnselected: function (activity) {
    this.props.onActivityUnselected(activity);
  },
  handleEditClicked: function () {
    this.props.onEditModeEnabled();
  },
  handleAttendClicked: function (activity) {
    this.props.onAttendClicked(activity);
  },
  render: function () {
    var activitiesList = models.activities.getActivities().map(function (activity) {
      return (
        <ActivityCard
          activity = { activity }
          onActivitySelected = { this.handleSelected }
          onActivityUnselected = { this.handleUnselected }
          onAttendClicked = { this.handleAttendClicked }
          onEditClicked = { this.handleEditClicked }
          selected = {
            !!this.props.selectedActivity &&
            this.props.selectedActivity.id == activity.id
          }
          key = { activity.id }
        />
      );
    }.bind(this));
    return (
      <div>
        { activitiesList }
      </div>
    );
  }
});

module.exports = ActivityCardList;
