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
      backgroundColor: '#00BCD4',
      padding: 8,
      borderRadius: 2,
      shadowColor: 'black',
      shadowOpacity: 0.15,
      shadowRadius: 2,
      shadowOffset: { width: 0, height: 3 },
      alignItems: 'center',
    },
    inner: {
      // display: 'inline-block'
      fontWeight: '600',
      color: 'white',
      fontSize: 16,
    }
  }

  return (
    <TouchableWithoutFeedback onPress={ props.onClick }>
      <View style={style.outer}>
        <View>
          <Text style={style.inner}>
            { props.label }
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

export default RaisedButton
