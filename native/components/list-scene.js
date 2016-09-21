import React from 'react'
import {
  Text,
  View,
} from 'react-native'
import ActivityCardList from './activity-card-list.js'
import TextButton from './text-button.js'

const ListScene = (props) => {

  return (
    <View style={{ flex: 1 }}>
      <ActivityCardList
        style={{ flex: 1 }}
        activities={ props.activities.activities }
        user={ props.user }
        activitiesInitialized={ props.activities.initialized }
        onAttendActivity={ props.onAttendActivity }
        onUnattendActivity={ props.onUnattendActivity }
        onEditActivity={ props.gotoEditActivityScene }
        selectedActivity={ props.activities.selectedActivity }
        onExpandActivity={ props.onExpandActivity }
        onUnexpandActivity={ props.onUnexpandActivity }
        onCreateClick={ props.gotoCreateActivityScene }
      />
      <View style={{
        backgroundColor: 'white',
        padding: 10,
        justifyContent: 'center',
        flexDirection: 'row',
        borderTopWidth: 1.5,
        borderTopColor: '#EEE'
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

export default ListScene
