import React from 'react'
import { Text } from 'react-native'
import ActivityCardList from './activity-card-list.js'

let init = false;

const handleAttendClick = () => {
  console.log('Attend clicked', arguments)
}

const handleUnattendClick = () => {
  console.log('Unattend clicked', arguments)
}

const ListScene = (props) => {
  if (init === false) {
    init = true;
    props.requestRefreshActivities(props.user.userId, props.user.sessionToken);
  }

  const activities = props.activities.activities;

  if (activities.length === 0) {
    return <Text>Nothing</Text>
  } else {
    return (
      <ActivityCardList
        style={{ flex: 1 }}
        activities ={ activities }
        onAttendClick={ handleAttendClick }
        onUnattendClick={ handleUnattendClick }
        onEditClick={ props.gotoEditActivityScene }
      />
    )
  }
}

export default ListScene
