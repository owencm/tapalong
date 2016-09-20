import React from 'react'
import {
  StyleSheet,
  Text,
  Image,
  View,
  TouchableWithoutFeedback,
} from 'react-native'
import { LoginManager, AccessToken } from 'react-native-fbsdk'

const FacebookLoginNative = (props) => {

  const handlePress = () => {
    LoginManager.logInWithReadPermissions(['public_profile', 'email', 'user_birthday']).then(
      (result) => {
        if (result.isCancelled) {
          alert('Login cancelled')
        } else {
          props.onLogin()
          AccessToken.getCurrentAccessToken().then(props.onTokenReady)
        }
      },
      (error) => {
        console.log(error)
        alert(error);
      }
    );
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
