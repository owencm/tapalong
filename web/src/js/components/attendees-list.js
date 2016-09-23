import React from 'react';
import m from '../m.js';

let AttendeesList = (props) => {

  if (props.attendeeNames < 1) {
    return <div />;
  } else {
    return (
      <div>
        <p><b>People going</b></p>
        {
          props.attendeeNames.map((attendee, index) => {
            return <p key = { index }>{attendee}</p>
          })
        }
      </div>
    )
  }

}

module.exports = AttendeesList;
