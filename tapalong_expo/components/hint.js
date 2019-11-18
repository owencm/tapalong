import React from 'react'
import m from '../m.js'
import {
  Text,
  View,
} from 'react-native'

const Hint = (props) => {
  const defaultStyle = {
    color: '#555',
    maxWidth: 600,
    flex: 1,
    textAlign: 'center',
  }

  const overridingStyles = props.style || {}

  const style = Object.assign({}, defaultStyle, overridingStyles)

  return (
    <View style={{ margin: 20 }}>
      <Text style={style}>
        { props.text }
      </Text>
    </View>
  )
}

export default Hint
