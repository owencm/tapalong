import React from 'react';
import m from '../m.js';
import {
  View,
  Text,
  TouchableWithoutFeedback,
} from 'react-native'

let RaisedButton = (props) => {
  let style = {
    outer: {
      backgroundColor: '#FFFF00',
      minWidth: 128,
      padding: 16,
      margin: 24,
      borderRadius: 2,
      shadowColor: 'black',
      shadowOpacity: 0.3,
      shadowRadius: 2,
      shadowOffset: { width: 0, height: 3 },
      alignItems: 'center',
    },
    inner: {
      // display: 'inline-block'
      fontWeight: '500',
      color: '#333',
    }
  }

  return (
    <TouchableWithoutFeedback onPress={ props.onClick }>
      <View style={style.outer}>
        <View>
          <Text style={style.inner}>
            { props.label.toUpperCase() }
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

export default RaisedButton
