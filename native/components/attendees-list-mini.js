import React from 'react'
import {
  Image,
  Text,
  View,
} from 'react-native'
import m from '../m.js'

const defaultTextStyle = {
  color: '#777',
  fontSize: 13
}

const AttendeesListMini = (props) => {

  if (props.attendees < 1) return null

  let string
  const a = props.attendees.map(attendee => attendee.name).reverse()
  if (a > 3) {
    otherCount = a - 2
    string = `${a[0]}, ${a[1]} and ${otherCount} others are coming 🎉`
  } else if (a.length === 3) {
    string = `${a[0]}, ${a[1]} and ${a[2]} are coming 🎉`
  } else if (a.length == 2) {
    string = `${a[0]} and ${a[1]} are coming 🎉`
  } else if (a.length == 1) {
    string = `${a[0]} is coming 🎉`
  }

  return (
    <View style={{ marginTop: 10 }}>
      <Text
        style={m(defaultTextStyle, props.style)}
      >
        { string }
      </Text>
    </View>
  )

}

export default AttendeesListMini
