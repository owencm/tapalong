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
      <If condition={props.readyToLogin}>
        <div id='loginButton'>
          <img src='images/login-button.png' id='loginButtonImg'></img>
        </div>
      </If>
    </div>
  );
}

module.exports = Login;
