import React from 'react'
import m from '../m.js'
import Card from './card.js'
import FriendIcon from './friend-icon.js'

const ActivityCardPlaceholder = (props) => {
  return (
    <Card>
      <View style={{padding: 24}}>
        <FriendIcon/>
        <Text>Person is doing something</Text>
      </View>
    </Card>
  )
}

export default ActivityCardPlaceholder
