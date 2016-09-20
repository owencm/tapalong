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
      <View style={{padding: 16, flex: 1, flexDirection: 'row', paddingBottom: 50}}>
        <FriendIcon/>
        <View style={{ backgroundColor: '#EEE', width: 150, height: 16 }}></View>
      </View>
    </Card>
  )
}

export default ActivityCardLoader
