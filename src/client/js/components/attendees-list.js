import React from 'react';
import m from '../m.js';

let AttendeesList = (props) => {

  if (props.attendees < 1) {
    return <div />;
  } else {
    return (
      <div>
        <p><b>People going</b></p>
        {
          props.attendees.map(function (attendee, index) {
            return <p key = { index }>{attendee}</p>
          })
        }
      </div>
    )
  }

}

module.exports = AttendeesList;
