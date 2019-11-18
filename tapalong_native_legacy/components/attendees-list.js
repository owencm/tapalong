import React from 'react'
import {
  Image,
  Text,
  View,
  TouchableWithoutFeedback,
  Linking,
} from 'react-native'
import m from '../m.js'

const defaultTextStyle = {
  color: '#444'
}

const handleUserPressed = (fbId) => {
  Linking.openURL(`https://m.me/${fbId}`)
}

const AttendeesList = (props) => {

  if (props.attendees < 1) return null

  const attendeeNameElements = props.attendees.map((attendee) => {
    const attendeeNameText = <Text style={ defaultTextStyle } key={ attendee.id }>
      { attendee.name }
    </Text>

    if (props.messagable) {
      return (
        <TouchableWithoutFeedback
          onPress={ () => handleUserPressed(attendee.fbId) }
          key={ attendee.id }
        >
          <View
            style={{ flexDirection: 'row', marginVertical: 4, alignItems: 'center' }}
          >
            <Image
              source={ require('../assets/messenger-icon.png') }
              style={{ marginRight: 6 }}
            />
            { attendeeNameText }
          </View>
        </TouchableWithoutFeedback>
      )
    }

    return attendeeNameText
  })

  const sectionHeader = props.ownedPlan ? 'Message people coming:' : 'People going:'

  return (
    <View style={ props.style }>
      <Text style={m(defaultTextStyle, { fontWeight: '500', marginBottom: 4 })}>
        { sectionHeader }
      </Text>
      { attendeeNameElements }
    </View>
  )

}

export default AttendeesList
