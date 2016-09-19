import React from 'react'
import {
  Text,
  View,
} from 'react-native'
import m from '../m.js'

const defaultTextStyle = {
  color: '#444'
}

const AttendeesList = (props) => {

  if (props.attendeeNames < 1) return null

  const attendeeNameElements = props.attendeeNames.map((attendee) => {
    return <Text
      style={ defaultTextStyle }
      key={ attendee }
    >
      { attendee }
    </Text>
  })

  return (
    <View style={ props.style }>
      <Text style={m(defaultTextStyle, { fontWeight: '500' })}>People going:</Text>
      { attendeeNameElements }
    </View>
  )

}

export default AttendeesList
