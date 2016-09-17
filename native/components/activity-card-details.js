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
        <Text>No more information available for this plan</Text>
      </If>
      <If condition={ props.description !== '' }>
        <Text style={ m(style, { fontWeight: '500' })}>Description</Text>
        { /* whiteSpace ensures we retain line breaks from the text.
          userSelect enables selection for copy pasting */ }
        <Text style={m(style, { whiteSpace: 'pre-wrap', WebkitUserSelect: 'text' })}>
          { props.description }
        </Text>
      </If>
      <If condition={ props.attendeeNames.length > 0 }>
        <AttendeesList attendeeNames={props.attendeeNames}/>
      </If>
    </View>
  )
}
