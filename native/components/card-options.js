import React from 'react';
import {
  View,
  Text,
  TouchableWithoutFeedback
} from 'react-native'
import m from '../m.js';

// Remember to disable the option after it lets you know it's been clicked
// We don't do that here as disabled is a prop and we can't move it to state
// without disallowing it to be used to create cards with disabled options.
// Also the string should be changed to the gerrand and have '...' added.

const CardOptions = (props) => {

  const defaultStyle = {
    /* Put the padding and margin on the options so the click targets are larger */
    paddingVertical: 14,
    paddingHorizontal: 20,
  }

  const textStyle = {
    fontWeight: '600',
    fontSize: 14,
  }

  const optionCards = props.options.map((option) => {
    let color;
    if (option.disabled) {
      color = '#CCC';
    } else if (option.type === 'bad') {
      color = '#E33';
    } else if (option.type === 'secondary') {
      color = '#4C4C4C';
    } else {
      color = '#02b0c6';
    }

    return (
      <TouchableWithoutFeedback
        onPress={ option.disabled ? () => {} : option.onClick }
        key={ option.label }
      >
        <View style = { defaultStyle } >
          <Text style={m(textStyle, { color })}>
            { option.label.toUpperCase() }
          </Text>
        </View>
      </TouchableWithoutFeedback>
    )
  });

  return (
    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
      { optionCards }
    </View>
  )

}

module.exports = CardOptions;
