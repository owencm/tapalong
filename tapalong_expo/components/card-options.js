import React from 'react';
import {
  View,
  Text,
  TouchableWithoutFeedback
} from 'react-native'
import m from '../m.js';
import TextButton from './text-button.js'

// Remember to disable the option after it lets you know it's been clicked
// We don't do that here as disabled is a prop and we can't move it to state
// without disallowing it to be used to create cards with disabled options.
// Also the string should be changed to the gerrand and have '...' added.

const CardOptions = (props) => {

  const getOptionButton = (option) => {
   return <TextButton
      label={ option.label }
      onClick={ option.onClick }
      type={ option.type }
      disabled={ option.disabled }
      key={ option.label }
      // style={{ paddingBottom: 20 }}
    />
  }

  const leftOptions = props.options.filter((option) => option.position === 'left')
  const rightOptions = props.options.filter((option) => option.position !== 'left')
  const leftOptionButtons = leftOptions.map(getOptionButton);
  const rightOptionButtons = rightOptions.map(getOptionButton);

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-end' }}>
        { leftOptionButtons }
      </View>
      <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
        { rightOptionButtons }
      </View>
    </View>
  )

}

export default CardOptions
