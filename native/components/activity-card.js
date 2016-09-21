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

  let options = [];

  const detailsAvaialable = props.activity.description !== '' ||
                            props.activity.attendeeNames.length > 0
  const alreadyShowingAllDetailsInSummary = props.activity.description === '' &&
                                            props.activity.isCreator

  const detailsOptionString = props.selected ? 'Hide details' : 'Details'

  if (detailsAvaialable && !alreadyShowingAllDetailsInSummary) {
    options.push({
      label: detailsOptionString,
      type: 'secondary',
      onClick: () => { props.onClick() }
    });
  }

  const getOption = (isCreator, isAttending) => {
    let string
    if (isCreator) {
      // Editing
      return {
        label: 'Edit',
        type: 'secondary',
        onClick: (e) => { e.stopPropagation(); props.onEditClick() },
      }
    } else if (isAttending) {
      // Unattending
      return {
        label: 'Cancel attending',
        type: 'secondary',
        onClick: (e) => { e.stopPropagation(); props.onUnattendClick() },
      }
    } else {
      // Attending
      return {
        label: 'Go along',
        onClick: (e) => { e.stopPropagation(); props.onAttendClick() },
      }
    }
  };

  options.push(getOption(props.activity.isCreator, props.activity.isAttending))


  return (
    <Card
      onClick={ () => props.onClick() }
    >
      <View style={{padding: 16, paddingBottom: 8, flex: 1, flexDirection: 'row'}}>
        <View style={{ flexDirection: 'column', alignItems: 'center' }}>
          <FriendIcon thumbnail={props.activity.thumbnail}/>
          <If condition={ !props.activity.isCreator && props.activity.isAttending }>
            <View style={{ position: 'absolute', paddingTop: 3, left: 0, right: 0, alignItems: 'center'}}>
              <FriendIcon thumbnail={ props.user.thumbnail } size={ 20 }/>
            </View>
          </If>
        </View>
        <View style={{flex: 1, flexDirection: 'column'}}>
          <ActivityCardTitle
            creatorName={ props.activity.isCreator ? 'You' : props.activity.creatorName }
            title={ props.activity.title }
            startTime={ props.activity.startTime }
          />
          <If condition={ props.activity.isCreator }>
            <ActivityCardDetails
              attendeeNames={ props.activity.attendeeNames }
            />
          </If>
          <Collapsible collapsed={!props.selected}>
            <ActivityCardDetails
              description={ props.activity.description }
              attendeeNames={ props.activity.isCreator ? [] : props.activity.attendeeNames }
              placeholderIfEmpty={ true }
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
