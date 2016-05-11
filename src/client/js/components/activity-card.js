import React from 'react';
import m from '../m.js';
import Card from './card.js';
import CardOptions from './card-options.js';
import AttendeesList from './attendees-list.js';
import FriendIcon from './friend-icon.js';
import Collapse from 'react-collapse';
import If from './if.js';

let ActivityCard = (props) => {

  // TODO: Refactor how we manage options
  const OPTIONS = {
    edit: 0,
    attend: 1,
    undoAttend: 2
  };

  let options = [];

  const getOptionEnum = (isCreator, isAttending) => {
    if (isCreator) {
      return OPTIONS.edit;
    } else if (isAttending) {
      return OPTIONS.undoAttend;
    } else {
      return OPTIONS.attend;
    }
  };

  const cardOptionEnum = getOptionEnum(props.activity.isCreator, props.activity.isAttending);
  const optionString = ['Edit', 'Go along', 'Cancel attending'][cardOptionEnum];
  const optionType = ['secondary', '', 'secondary'][cardOptionEnum];

  const onOptionClick = (() => {
    switch(cardOptionEnum) {
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

  options.push({ label: optionString, onClick: onOptionClick, type: optionType });

  const detailsAvaialable = props.activity.description !== '' ||
                            props.activity.attendeeNames.length > 0;
  const detailsOptionString = props.selected ? 'Hide details' : 'Details';

  if (detailsAvaialable) {
    options.push({ label: detailsOptionString, type: 'secondary' });
  }

  return (
    <Card
      backgroundColor={props.activity.isAttending || props.activity.isCreator ? '#cdf9c9' : undefined}
      onClick={ () => props.onClick(props.activity) }
    >
      <div style={{padding: '16px', paddingBottom: '8px'}}>
        <FriendIcon thumbnail={props.activity.thumbnail}/>
        {/* This forces the title to not wrap around the bottom of the icon */}
        <div style={{overflow: 'hidden'}}>
          { /* Title section */ }
          <span>
          { props.activity.isCreator ? <b>You</b> : <b>{props.activity.creatorName}</b> }
            <span> will be </span>
          </span>
          <b>{props.activity.title}</b> {getDateString(props.activity.startTime)}
          { /* Description and attendees */ }
          <Collapse isOpened={props.selected} springConfig={{stiffness: 300}}>
            <div style={{paddingTop: '16px'}}>
              { /* TODO: Tidy up this crap! */ }
              <If condition={props.activity.description !== ''}>
                <div>
                  <p><b>Description</b></p>
                  { /* whiteSpace ensures we retain line breaks from the text.
                    userSelect enables selection for copy pasting */ }
                  <p style={{whiteSpace: 'pre-wrap', WebkitUserSelect: 'text'}}>
                    {props.activity.description}
                  </p>
                </div>
              </If>
              <If condition={ !props.activity.isCreator }>
                <div>
                  <If condition={props.activity.description !== '' &&
                                  props.activity.attendeeNames.length > 0}>
                    <br />
                  </If>
                  <AttendeesList attendeeNames={props.activity.attendeeNames}/>
                </div>
              </If>
              <If condition={props.activity.description === '' &&
                              props.activity.attendeeNames.length === 0}>
                <p>No more information available for this plan</p>
              </If>
            </div>
          </Collapse>
          { /* Always show attendees if it's your plan and there are any */ }
          <If condition={ props.activity.isCreator && props.activity.attendeeNames.length > 0 }>
            <div>
              <br />
              <AttendeesList attendeeNames={props.activity.attendeeNames}/>
            </div>
          </If>
        </div>
      </div>
      <CardOptions
        options={options}
      />
    </Card>
  );

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
