// Require react, convenience libraries and UI components
var React = require('react');
var m = require('./m.js');
var ActivityCard = require('./activity-card.js');

// Require core logic
var models = require('./models.js');

module.exports = React.createClass({
  handleSelected: function (activity) {
    this.props.onActivitySelected(activity);
  },
  handleUnselected: function (activity) {
    this.props.onActivityUnselected(activity);
  },
  handleEditClicked: function () {
    this.props.onEditModeEnabled();
  },
  render: function () {
    var activitiesList = models.activities.getActivities().map(function (activity) {
      activity.key = activity.id;
      return (
        <ActivityCard
          activity={activity}
          onActivitySelected={this.handleSelected}
          onActivityUnselected={this.handleUnselected}
          onEditClicked={this.handleEditClicked}
          selected={this.props.selectedActivity == activity}
        />
      );
    }.bind(this));
    return (
      <div>
        {activitiesList}
      </div>
    );
  }
});
