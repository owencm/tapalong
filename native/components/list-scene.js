import React from 'react'
import {
  Text,
  View,
} from 'react-native'
import ActivityCardList from './activity-card-list.js'
import TextButton from './text-button.js'

let init = false;

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
      <View style={{ flex: 1 }}>
        <ActivityCardList
          style={{ flex: 1 }}
          activities ={ activities }
          onAttendClick={ props.onAttendActivity }
          onUnattendClick={ props.onUnattendActivity }
          onEditClick={ props.gotoEditActivityScene }
          selectedActivity={ props.activities.selectedActivity }
          onExpandActivity={ props.onExpandActivity }
          onUnexpandActivity={ props.onUnexpandActivity }
        />
        <View style={{
          backgroundColor: 'white',
          padding: 10,
          justifyContent: 'center',
          flexDirection: 'row',
        }}
        >
          <View style={{ justifyContent: 'center' }}>
            <Text style={{ color: '#444' }}>Got something planned?</Text>
          </View>
          <TextButton label='Add plan' onClick={ props.gotoCreateActivityScene } />
        </View>
      </View>
    )
  }
}

export default ListScene
