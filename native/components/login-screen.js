import React from 'react'
import {
  Image,
  Text,
  View,
  Linking,
  TouchableWithoutFeedback
} from 'react-native'
import m from '../m.js'
// import FacebookLogin from './facebook-login.js'
import If from './if.js'
import FacebookLoginNative from './facebook-login-native.js'

const handleTermsAndConditionsClick = () => {
  Linking.openURL(`https://www.updogapp.co/legal`)
}

const LoginScene = (props) => {

  const loginTextStyle = {
    color: 'white',
    fontSize: 15,
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

  const subTextStyle = {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    backgroundColor: 'rgba(0,0,0,0)'
  }

  const subTextLayoutStyle = {
    textAlign: 'center',
    paddingTop: 24,
    paddingHorizontal: 80,
  }

  const underlineStyle = {
    textDecorationLine: 'underline'
  }

  // props.readyToLogin
  const readyToLogin = true

  const loginButton = (
    <FacebookLoginNative
      // onLogin={ props.onLoginDismissed }
      onTokenReady={ props.onLoginComplete }
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

  const termsAndConditions = (
    <TouchableWithoutFeedback
      onPress ={ handleTermsAndConditionsClick }
    >
      <View>
        <Text style={ m(subTextStyle, subTextLayoutStyle) }>
          We will never post to Facebook.

          By continuing you agree to our <Text style={ underlineStyle }>Terms</Text> and that you have read our <Text style={ underlineStyle }>Privacy Policy</Text>.
        </Text>
      </View>
    </TouchableWithoutFeedback>
  )

  const header = <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
    <Image
      source={ require('../assets/icon-transparent.png') }
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
    { termsAndConditions }
  </View>

  return (
    <View style={{ flex: 1 }}>
      <Image
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        source={ require('../assets/background-mobile.jpg') }
      >
      </Image>
      <View style={{ flex: 1 }}>
        { header }
        { mid }
        { footer }
      </View>
    </View>
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
