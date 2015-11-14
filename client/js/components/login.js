// Require react, convenience libraries and UI components
var React = require('react');
var m = require('../m.js');
var FacebookLogin = require('./facebook-login.js');

var Login = (props) => {

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

var LoginInner = (props) => {
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
      { props.readyToLogin ?
        (
          <div id='loginButton'>
            <img src='images/login-button.png' id='loginButtonImg'></img>
          </div>
        ) : null }
    </div>
  );
}

module.exports = Login;
