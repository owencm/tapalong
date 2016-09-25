import React from 'react';
import {
  Text,
  View
} from 'react-native';
import m from '../m.js';
import If from './if.js';
import AttendeesList from './attendees-list.js';

const defaultTextStyle = {
  color: '#444',
}

const sectionStyle = {
  paddingTop: 16
}

export default function(props) {

  let sections = []

  const hasDescription = !(props.description === undefined || props.description === '')
  if ( !hasDescription && props.attendees.length === 0 && props.placeholderIfEmpty) {
    sections.push(
      <Text
        style={ m(defaultTextStyle, sectionStyle, { fontStyle: 'italic' }) }
        key='no-details'
      >
        No details
      </Text>
    )
  }

  if (hasDescription) {
    /* whiteSpace ensures we retain line breaks from the text.
      userSelect enables selection for copy pasting
      css: whiteSpace: 'pre-wrap', WebkitUserSelect: 'text' */
    sections.push(
      <Text
        style={m(defaultTextStyle, sectionStyle, { fontStyle: 'italic' })}
        key='description'
      >
        { props.description }
      </Text>
    )
  }

  if (props.attendees.length > 0) {
    sections.push(
      <AttendeesList
        attendees={ props.attendees }
        ownedPlan={ props.ownedPlan }
        style={sectionStyle}
        key='attendee-list'
        messagable={ props.ownedPlan }
      />
    )
  }

  return (
    <View>
      { sections }
    </View>
  )
}
