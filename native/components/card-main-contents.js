import React from 'react';
import m from '../m.js';
import {
  View,
} from 'react-native'

let CardMainContents = (props) => {
  return (
    <View
      style={ m({
        padding: 16,
        paddingBottom: 8,
      }, props.style) }
    >
      { props.children }
    </View>
  )
}

export default CardMainContents
