// Require react, convenience libraries and UI components
'use strict';

var React = require('react');
var m = require('./m.js');

var AttendeesList = React.createClass({
  displayName: 'AttendeesList',

  render: function render() {
    if (this.props.attendees < 1) {
      return null;
    } else {
      return React.createElement(
        'div',
        null,
        React.createElement(
          'p',
          null,
          React.createElement(
            'b',
            null,
            'People going'
          )
        ),
        this.props.attendees.map(function (attendee, index) {
          return React.createElement(
            'p',
            { key: index },
            attendee
          );
        })
      );
    }
  }
});

module.exports = AttendeesList;
