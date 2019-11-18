import React from 'react'
import { View } from 'react-native'

let If = ({condition, children}) => {
  if (children.length > 1) {
    return condition ? <View>{ children }</View> : null;
  }
  return condition ? children : null;
}

export default If
