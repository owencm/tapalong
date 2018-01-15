import React from 'react'
import {
  StyleSheet,
  Text,
  Image,
  View,
  TouchableWithoutFeedback,
} from 'react-native'
// import { LoginManager, AccessToken } from 'react-native-fbsdk'
import { Facebook } from 'expo'

const FacebookLoginNative = (props) => {

  const handlePress = () => {
    Facebook.logInWithReadPermissionsAsync('175370155978273', {
      permissions: ['public_profile', 'email', 'user_friends'],
    }).then(({ type, token }) => {
      if (type === 'success') {
        // Once upon a time I split these up so I could navigate the user to the list *before* the token was actually available, but these happen together today.
        // props.onLogin()
        return props.onTokenReady(token)
      } else {
        alert('Login cancelled')
      }
    }).catch((e) => {
      console.error(e)
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
