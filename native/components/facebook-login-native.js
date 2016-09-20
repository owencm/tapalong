import React from 'react'
import {
  StyleSheet,
  Text,
  Image,
  View,
  TouchableWithoutFeedback,
} from 'react-native'
import { LoginManager } from 'react-native-fbsdk'

const FacebookLoginNative = (props) => {

  const handlePress = () => {
    LoginManager.logInWithReadPermissions(['public_profile', 'email', 'user_birthday']).catch((e) => {
      console.log(e);
    })
  }

  // Clone the children so we can set props on them indicating the state of the login process
  const children = React.Children.map(props.children, (child) => {
    return React.cloneElement(child, { readyToLogin: true })
  })

  return (
    <TouchableWithoutFeedback onPress={ handlePress }>
      <View>
        { children }
      </View>
    </TouchableWithoutFeedback>
  )
}


export default FacebookLoginNative
