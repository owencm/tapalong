import React from 'react'
import {
  Image,
  Text,
  View,
} from 'react-native'
import m from '../m.js'
// import FacebookLogin from './facebook-login.js'
import If from './if.js'
import FacebookLoginNative from './facebook-login-native.js'

const LoginScene = (props) => {

  const handleLoginDismissed = () => {
    props.onLoginDismissed()
  }

  const handleTokenReady = ({ accessToken }) => {
    props.onLoginComplete(accessToken)
  }

  const loginTextStyle = {
    color: 'white',
    fontSize: 20
  }

  const loginButtonStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    backgroundColor: '#3a5b98',
    borderWidth: 1,
    borderColor: '#7aa9fb',
    bottom: 0,
  }

  // props.readyToLogin
  const readyToLogin = true

  const promo = (
    <Text
      style={{
        fontSize: 20,
        color: 'white',
        padding: 40,
        backgroundColor: 'rgba(0, 0, 0, 0)',
      }}
    >
      Do more together with friends
    </Text>
  )

  const loginButton = (
    <FacebookLoginNative
      onLogin={ handleLoginDismissed }
      onTokenReady={ handleTokenReady }
    >
      <View style={ loginButtonStyle }>
        <If condition={ readyToLogin }>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={ require('../assets/facebook-f.png') }
              style={{
                width: 25,
                height: 50,
                marginRight: 20
              }}
            />
            <Text style={ loginTextStyle }>Continue with Facebook</Text>
          </View>
        </If>
        <If condition={ !readyToLogin }>
          <Text style={ loginTextStyle }>Loading...</Text>
        </If>
      </View>
    </FacebookLoginNative>
  )

  return (
    <Image
      style={{ flex: 1, width: null, height: null, justifyContent: 'flex-end' }}
      source={ require('../assets/background-mobile.jpg') }
    >
      { promo }
      { loginButton }
    </Image>
  )
};

// <FacebookLogin
//   appId='175370155978273'
//   scope='public_profile, user_friends'
//   autoLoad
//   loginHandler={ handleLogin } >
  // <LoginInner />
// </FacebookLogin>

export default LoginScene
