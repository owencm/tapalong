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
    fontSize: 12,
    fontWeight: '700',
  }

  const loginButtonStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    backgroundColor: '#3a5b98',
    borderWidth: 1,
    borderColor: '#7aa9fb',
    bottom: 0,
    borderRadius: 30,
    marginHorizontal: 40,
  }

  // props.readyToLogin
  const readyToLogin = true

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
                width: 13,
                height: 26,
                marginRight: 14
              }}
            />
            <Text style={ loginTextStyle }>CONTINUE WITH FACEBOOK</Text>
          </View>
        </If>
        <If condition={ !readyToLogin }>
          <Text style={ loginTextStyle }>Loading...</Text>
        </If>
      </View>
    </FacebookLoginNative>
  )

  const header = <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
    <Image
      source={ require('../assets/logo-transparent.png') }
      style={{ height: 30, width: 30 }}
    />
    <View style={{ marginHorizontal: 10, height: 30, width: 1, backgroundColor: 'white' }}></View>
    <Text
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0)',
        textAlign: 'center',
        fontWeight: '800',
        fontSize: 28,
        color: 'white'
      }}
    >
      Withapp
    </Text>
  </View>

  const mid = <View style={{ flex: 1, justifyContent: 'center'}}>
    <Text
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0)',
        textAlign: 'center',
        fontWeight: '800',
        fontSize: 45,
        color: 'white',
        margin: 20,
      }}
    >
      Spend time with friends.
    </Text>
  </View>

  const footer = <View style={{ flex: 1, justifyContent: 'center' }}>
    { loginButton }
  </View>

  return (
    <Image
      style={{ flex: 1, width: null, height: null }}
      source={ require('../assets/background-mobile.jpg') }
    >
      { header }
      { mid }
      { footer }
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
