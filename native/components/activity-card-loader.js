import React from 'react'
import {
  View,
  Text,
} from 'react-native'
import m from '../m.js'
import Card from './card.js'
import FriendIcon from './friend-icon.js'

const ActivityCardLoader = (props) => {
  return (
    <Card>
      <View style={{ padding: 16, flex: 1, flexDirection: 'row', paddingBottom: 56 }}>
        <FriendIcon/>
        <View style={{flex: 1, flexDirection: 'column' }}>
          <View style={{ backgroundColor: '#EEE', width: 140, height: 8 }}></View>
          <View style={{ backgroundColor: '#EEE', width: 250, height: 8, marginTop: 10 }}></View>
        </View>
      </View>
    </Card>
  )
}

export default ActivityCardLoader
