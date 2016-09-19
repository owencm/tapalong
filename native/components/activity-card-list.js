import React from 'react'
import m from '../m.js'
import { ScrollView } from 'react-native'
import ActivityCard from './activity-card.js'
import ActivityCardListPlaceholder from './activity-card-list-placeholder'

const getActivitiesList = (props) => {

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

  // TODO: bind the activity in these functions rather than in the child
  return props.activities.map((activity) => {
    return (
      <ActivityCard
        activity = { activity }
        onClick = { handleActivityClick }
        onAttendClick = { props.onAttendClick }
        onUnattendClick = { props.onUnattendClick }
        onEditClick = { props.onEditClick }
        selected = {
          !!props.selectedActivity &&
          props.selectedActivity.clientId == activity.clientId
        }
        key = { activity.clientId }
      />
    );
  });


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
