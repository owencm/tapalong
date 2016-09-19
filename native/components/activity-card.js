import React from 'react';
import m from '../m.js';
import { View, Text } from 'react-native'
import Card from './card.js';
import CardOptions from './card-options.js';
import ActivityCardTitle from './activity-card-title.js';
import AttendeesList from './attendees-list.js';
import FriendIcon from './friend-icon.js';
import Collapsible from 'react-native-collapsible';
import ActivityCardDetails from './activity-card-details.js'
// import Collapse from 'react-collapse';
import If from './if.js';

export default function(props) {

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
    options.push({
      label: detailsOptionString,
      type: 'secondary',
      onClick: () => { props.onClick(props.activity) }
    });
  }

  return (
    <Card
      onClick={ () => props.onClick(props.activity) }
    >
      <View style={{padding: 16, paddingBottom: 8, flex: 1, flexDirection: 'row'}}>
        <FriendIcon thumbnail={props.activity.thumbnail}/>
        <View style={{flex: 1, flexDirection: 'column'}}>
          <ActivityCardTitle
            creatorName={ props.activity.isCreator ? 'You' : props.activity.creatorName }
            title={ props.activity.title }
            startTime={ props.activity.startTime }
          />
          <Collapsible collapsed={!props.selected}>
            <ActivityCardDetails
              description={ props.activity.description }
              isCreator={ props.activity.isCreator }
              attendeeNames={ props.activity.attendeeNames }
            />
          </Collapsible>
        </View>
      </View>
      <CardOptions
        options={options}
      />
    </Card>
  );

};
