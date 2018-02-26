import React from 'react'
import m from '../m.js'
import {
  View,
  Text,
  Linking,
  Image,
  TouchableHighlight,
  ActionSheetIOS,
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

  const handleMenuClick = () => {
    ActionSheetIOS.showActionSheetWithOptions({
      options: ['Cancel', 'Report plan', 'Block user'],
      destructiveButtonIndex: 1,
      destructiveButtonIndex: 2,
      cancelButtonIndex: 0,
    },
    (buttonIndex) => {
      if (buttonIndex === 1) {
        props.onReportClick()
      } else if (buttonIndex === 2) {
        props.onBlockClick()
      }
    });
  }

  const detailsAvaialable = props.plan.description !== '' ||
                            props.plan.attendees.length > 0

  const detailsOptionString = props.selected ? 'Hide details' : 'Details'

  const creatorFbId = props.plan.creator.fbId

  // const onMessageClick = () => {
  //   console.log(`fb-messenger-public://user-thread/${creatorFbId}`)
  //   Linking.openURL(`fb-messenger-public://`)
  // }

  if (detailsAvaialable) {
    options.push({
      label: detailsOptionString,
      type: 'secondary',
      onClick: () => { props.onClick() }
    });
  }

  const getOptions = (isCreator, isAttending) => {
    // const messageOption = {
    //   label: 'Message',
    //   type: 'secondary',
    //   onClick: (e) => { e.stopPropagation(); onMessageClick() },
    // }
    if (isCreator) {
      return [{
        label: 'Edit',
        type: 'secondary',
        onClick: (e) => { e.stopPropagation(); props.onEditClick() },
      }]
    } else if (isAttending) {
      return [
        // messageOption,
        {
          label: '✅ Going',
          type: 'secondary',
          onClick: (e) => { e.stopPropagation(); props.onUnattendClick() },
        },
      ]
    } else {
      return [
        // messageOption,
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
          <FriendIcon thumbnail={props.plan.creator.thumbnail}/>
          <If condition={ !props.plan.isCreator && props.plan.isAttending }>
            <View style={{ position: 'absolute', top: 44, left: 0, right: 0, alignItems: 'center'}}>
              <FriendIcon thumbnail={ props.user.thumbnail } size={ 20 }/>
            </View>
          </If>
        </View>
        <View style={{flex: 1, flexDirection: 'column'}}>
          <PlanCardTitle
            creatorName={ props.plan.isCreator ? 'You' : props.plan.creator.name }
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
      { /* Use TouchableHighlight because TouchableWithoutFeedback get's layed out incorrectly for some reason */ }
      <TouchableHighlight
        style={{ position: 'absolute', right: 11, top: 5 }}
        onPress={ handleMenuClick }
        underlayColor="rgba(0, 0, 0, 0)"
      >
        <Image source={require('../assets/more-icon.png')} style={{ width: 18, height: 18, opacity: 0.6 }}></Image>
      </TouchableHighlight>
    </Card>
  );

};
