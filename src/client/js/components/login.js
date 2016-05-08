import React from 'react';
import m from '../m.js';
import FacebookLogin from './facebook-login.js';
import If from './if.js'

let Login = (props) => {

  let handleLogin = (fbResponse) => {
    props.onLoginToFacebook(fbResponse.accessToken);
  }

  return (
    <FacebookLogin
      appId='175370155978273'
      class='facebook-login'
      scope='public_profile, user_friends'
      autoLoad
      loginHandler={ handleLogin } >
      <LoginInner />
    </FacebookLogin>
  )
};

let LoginInner = (props) => {
  // TODO: use props.readyToLogin to modify the rendering
  const loginTextStyle = {
    color: 'white',
    fontSize: '2em'
  }
  const loginButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    width: '100%',
    backgroundColor: '#3a5b98',
    border: '1px solid #7aa9fb',
    bottom: 0,
    position: 'fixed',
  }
  return (
    <div id='login'>
      <div id='splash'>
      </div>
      <div id='slogan'>
        <h1 style={{
          fontSize: '2.5em',
          color: 'white',
          padding: '40px'
        }}>Do more together with friends</h1>
      </div>
      <div style={loginButtonStyle}>
        <If condition={props.readyToLogin}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src='images/facebook-f.png' style={{
                width: 25,
                height: 50,
                marginRight: 20
              }} />
            <span style={loginTextStyle}>Login with Facebook</span>
          </div>
        </If>
        <If condition={!props.readyToLogin}>
          <span style={loginTextStyle}>Loading...</span>
        </If>
      </div>
    </div>
  );
}

module.exports = Login;
