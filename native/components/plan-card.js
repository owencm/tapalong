import React from 'react'
import m from '../m.js'
import {
  View,
  Text,
  Linking,
} from 'react-native'
import Card from './card.js'
import CardOptions from './card-options.js'
import CardMainContents from './card-main-contents.js'
import PlanCardTitle from './plan-card-title.js'
import FriendIcon from './friend-icon.js'
import Collapsible from 'react-native-collapsible'
import PlanCardDetails from './plan-card-details.js'
import AttendeesListMini from './attendees-list-mini.js'
// import Collapse from 'react-collapse';
import If from './if.js'

export default function(props) {

  let options = [];

  const detailsAvaialable = props.plan.description !== '' ||
                            props.plan.attendees.length > 0

  const detailsOptionString = props.selected ? 'Hide details' : 'Details'

  const onMessageClick = () => {
    Linking.openURL('https://m.me/elizharwood')
  }

  if (detailsAvaialable) {
    options.push({
      label: detailsOptionString,
      type: 'secondary',
      onClick: () => { props.onClick() }
    });
  }

  const getOptions = (isCreator, isAttending) => {
    const messageOption = {
      label: 'Message',
      type: 'secondary',
      onClick: (e) => { e.stopPropagation(); onMessageClick() },
    }
    if (isCreator) {
      // Editing
      return [{
        label: 'Edit',
        type: 'secondary',
        onClick: (e) => { e.stopPropagation(); props.onEditClick() },
      }]
    } else if (isAttending) {
      // Unattending
      return [
        messageOption,
        {
          label: '✅ Going',
          type: 'secondary',
          onClick: (e) => { e.stopPropagation(); props.onUnattendClick() },
        },
      ]
    } else {
      // Attending
      return [
        messageOption,
        {
          label: 'Go along',
          onClick: (e) => { e.stopPropagation(); props.onAttendClick() },
        },
      ]
    }
  };

  options = [...options, ...getOptions(props.plan.isCreator, props.plan.isAttending)]


  return (
    <Card
      onClick={ () => props.onClick() }
    >
      <CardMainContents style={{ flexDirection: 'row' }}>
        <View style={{ flexDirection: 'column', alignItems: 'center' }}>
          <FriendIcon thumbnail={props.plan.thumbnail}/>
          <If condition={ !props.plan.isCreator && props.plan.isAttending }>
            <View style={{ position: 'relative', paddingTop: 3, left: 0, right: 0, alignItems: 'center'}}>
              <FriendIcon thumbnail={ props.user.thumbnail } size={ 20 }/>
            </View>
          </If>
        </View>
        <View style={{flex: 1, flexDirection: 'column'}}>
          <PlanCardTitle
            creatorName={ props.plan.isCreator ? 'You' : props.plan.creatorName }
            title={ props.plan.title }
            startTime={ props.plan.startTime }
          />
          <If condition={ props.plan.isCreator }>
            <AttendeesListMini
              attendees={ props.plan.attendees }
            />
          </If>
          <Collapsible collapsed={!props.selected}>
            <PlanCardDetails
              description={ props.plan.description }
              attendees={ props.plan.attendees }
              placeholderIfEmpty={ true }
              ownedPlan={ props.plan.isCreator }
            />
          </Collapsible>
        </View>
      </CardMainContents>
      <CardOptions
        options={options}
      />
    </Card>
  );

};
