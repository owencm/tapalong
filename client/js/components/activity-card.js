import React from 'react';
import m from '../m.js';
import Card from './card.js';
import CardOptions from './card-options.js';
import AttendeesList from './attendees-list.js';
import FriendIcon from './friend-icon.js';
import Collapse from 'react-collapse';

let ActivityCard = (props) => {

  let getCardsOption = (is_creator, is_attending) => {
    if (is_creator) {
      return OPTIONS.edit;
    } else if (is_attending) {
      return OPTIONS.undoAttend;
    } else {
      return OPTIONS.attend;
    }
  };

  let cardOption = getCardsOption(props.activity.is_creator, props.activity.is_attending);
  let optionString = ['Edit', 'Go along', 'Cancel attending'][cardOption];
  let onOptionClick = (() => {
    switch(cardOption) {
      case OPTIONS.edit:
        return (e) => { e.stopPropagation(); props.onEditClick(props.activity) };
        break;
      case OPTIONS.attend:
        return (e) => { e.stopPropagation(); props.onAttendClick(props.activity) };
        break;
      case OPTIONS.undoAttend:
        return (e) => { e.stopPropagation(); props.onUnattendClick(props.activity) };
        break;
    }
  })();

  return (
    <Card
      backgroundColor={props.activity.is_attending ? '#cdf9c9' : undefined}
      onClick={ () => props.onClick(props.activity) }
    >
      <div style={{padding: '24px'}}>
        <FriendIcon thumbnail={props.activity.thumbnail}/>
        {/* This forces the title to not wrap around the bottom of the icon */}
        <div style={{overflow: 'hidden'}}>
          { /* Title section */ }
          <span>
          { props.activity.is_creator ? <b>You</b> : <b>{props.activity.creator_name}</b> }
            <span> will be </span>
          </span>
          <b>{props.activity.title}</b> {getDateString(props.activity.start_time)}
          {
            /* Description and attendees */
            <Collapse isOpened={props.selected}>
              <div style={{paddingTop: '16px'}}>
                { /* TODO: Tidy up this crap! */ }
                {
                  props.activity.description !== '' ? (
                    <div>
                      <p><b>Description</b></p>
                      { /* whiteSpace ensures we retain line breaks from the text.
                        userSelect enables selection for copy pasting */ }
                      <p style={{whiteSpace: 'pre-wrap', WebkitUserSelect: 'text'}}>
                        {props.activity.description}
                      </p>
                    </div>
                  ) : null
                }
                {
                  (props.activity.description !== '' && props.activity.attendees.length > 0) ?
                    <br /> : null
                }
                <AttendeesList attendees={props.activity.attendees}/>
                {
                  (props.activity.description == '' && props.activity.attendees.length == 0) ? (
                    <p>No more information available for this plan</p>
                  ) : null
                }
              </div>
            </Collapse>
          }
        </div>
      </div>
      <CardOptions
        options={[{label: optionString, onClick: onOptionClick}]}
      />
    </Card>
  );

};

let OPTIONS = {
  edit: 0,
  attend: 1,
  undoAttend: 2
};

// E.g. "tomorrow at 2pm", or "on Wednesday at 8pm"
// TODO: Render 0AM as Midnight
let getDateString = (dateTime) => {
  let today = Date.today();
  let tomorrow = (Date.today()).add(1).days();
  // This is a copy of the date (time stripped) used for date comparison
  let dateCopy = dateTime.clone().clearTime();
  let str = '';
  if (today.equals(dateCopy)) {
    str += 'today ';
  } else if (tomorrow.equals(dateCopy)) {
    str += 'tomorrow ';
  } else {
    str += 'on ' + dateTime.toString('dddd dS') + ' ';
  }
  str += 'at ' + dateTime.toString('h');
  let minutes = dateTime.toString('mm');
  if (minutes !== '00') {
    str += ':' + minutes;
  }
  str += dateTime.toString('tt').toLowerCase();
  return str;
};

module.exports = ActivityCard;
