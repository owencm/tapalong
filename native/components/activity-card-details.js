import React from 'react';
import {
  Text,
  View
} from 'react-native';
import m from '../m.js';
import If from './if.js';
import AttendeesList from './attendees-list.js';

const style = {
  color: '#444',
}

export default function(props) {
  return (
    <View style={{paddingTop: 16}}>
      <If condition={ props.description === '' &&
                      props.attendeeNames.length === 0}>
        <Text style={ m(style, { fontStyle: 'italic' }) } >No details</Text>
      </If>
      <If condition={ props.description !== '' }>
        { /* <Text style={ m(style, { fontWeight: '500' })}>Details</Text> */ }
        { /* whiteSpace ensures we retain line breaks from the text.
          userSelect enables selection for copy pasting
          css: whiteSpace: 'pre-wrap', WebkitUserSelect: 'text' */
        }
        <Text style={m(style, { fontStyle: 'italic' })}>
          { props.description }
        </Text>
      </If>
      <If condition={ props.attendeeNames.length > 0 }>
        <AttendeesList attendeeNames={props.attendeeNames}/>
      </If>
    </View>
  )
}
