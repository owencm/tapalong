// Require react, convenience libraries and UI components
var React = require('react');
var m = require('./m.js');
var FacebookLogin = require('./facebook-login.js');

// Require core logic
var models = require('./models.js');

var Login = React.createClass({

  render: function () {
    return (
      <FacebookLogin
        appId='175370155978273'
        class='facebook-login'
        scope='public_profile'
        autoLoad
        loginHandler={ this.handleLogin } >
        <LoginInner />
      </FacebookLogin>
    )
  },

  handleLogin: function (result) {
    console.log(result);
    models.startLogin(result.accessToken, this.props.onLoginComplete, function(){});
    // var userId = 1;
    // var userName = 'Owen Campbell-Moore';
    // var sessionToken = 'letmein';
    // models.user.setUserName(userName);
    // models.user.setUserId(userId);
    // models.user.setSessionToken(sessionToken);
    // models.activities.tryRefreshActivities(function () {
    //   this.props.onLoginComplete();
    // }.bind(this), function () {
    //   console.log('Failed to download activities')
    // });
  }
});

var LoginInner = React.createClass({
  // Note not using arrow functions as that causes this to be undefined
  render: function () {
    // TODO: use this to modify the rendering
    console.log(this.props.readyToLogin);
    return (
      <div id='login'>
        <div id='splash'>
        </div>
        <div id='slogan'>
          <img src='images/slogan.png'></img>
        </div>
        <div id='loginButton'>
          <img src='images/login-button.png' id='loginButtonImg'></img>
        </div>
      </div>
    );
  }
});

module.exports = Login;
