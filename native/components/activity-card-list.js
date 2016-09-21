import React from 'react'
import m from '../m.js'
import {
  ScrollView,
  View,
} from 'react-native'
import ActivityCard from './activity-card.js'
import ActivityCardLoader from './activity-card-loader.js'
import ActivityCardListPlaceholder from './activity-card-list-placeholder'

const getActivitiesList = (props) => {
  if (props.activitiesInitialized === false) {
    return <View>
      <ActivityCardLoader/>
      <ActivityCardLoader/>
    </View>
  }

  if (props.activities.length === 0) {
    return <ActivityCardListPlaceholder onCreateClick={ props.onCreateClick } />
  }

  const handleActivityClick = (activity) => {
    // If something is selected, and it's the activity clicked...
    if (props.selectedActivity &&
        props.selectedActivity.clientId == activity.clientId) {
      props.onUnexpandActivity(activity)
    } else {
      props.onExpandActivity(activity)
    }
  }

  const activityElements = props.activities.map((activity) => {
    return (
      <ActivityCard
        activity={ activity }
        user={ props.user }
        onClick={ () => handleActivityClick(activity) }
        onAttendClick={ () => props.onAttendActivity(activity) }
        onUnattendClick={ () => props.onUnattendActivity(activity) }
        onEditClick={ () => props.onEditActivity(activity) }
        selected={
          !!props.selectedActivity &&
          props.selectedActivity.clientId == activity.clientId
        }
        key={ activity.clientId }
      />
    );
  });

  return <View style={{ paddingBottom: 18 }}>{ activityElements }</View>

}

const ActivityCardList = (props) => {

  const activitiesList = getActivitiesList(props)

  return (
    <ScrollView style={{ flex: 1 }}>
      { activitiesList }
    </ScrollView>
  )

}

export default ActivityCardList;
