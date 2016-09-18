import React from 'react';
import { TouchableWithoutFeedback, View } from 'react-native'
import m from '../m.js';

export default function(props) {

  let cardStyle = {
    /* This puts the border inside the edge */
    // boxSizing: 'border-box',
    maxWidth: 600,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    // color: '#444',
    // lineHeight: '1.5em',
    backgroundColor: '#FAFAFA',
    /* For fading into 'attending' */
    // WebkitTransition: 'background-color 0.5s',
  };

  if (props.backgroundColor !== undefined) {
    cardStyle = m(cardStyle, {backgroundColor: props.backgroundColor});
  }

  return (
    <TouchableWithoutFeedback
      onPress={ props.onClick ? props.onClick : () => {} }
    >
      <View style={ cardStyle }>
        { props.children }
      </View>
    </TouchableWithoutFeedback>
  );

}
