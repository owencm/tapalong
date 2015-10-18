// Require react, convenience libraries and UI components
var React = require('react');
var m = require('./m.js');

var AttendeesList = React.createClass({
  render: function () {
    if (this.props.attendees < 1) {
      return null;
    } else {
      return (
        <div>
          <p><b>People going</b></p>
          {
            this.props.attendees.map(function (attendee, index) {
              return <p key = { index }>{attendee}</p>
            })
          }
        </div>
      )
    }
  }
});

module.exports = AttendeesList;
