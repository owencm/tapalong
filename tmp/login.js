// Require react, convenience libraries and UI components
'use strict';

var React = require('react');
var m = require('./m.js');
var FacebookLogin = require('./facebook-login.js');

// Require core logic
var models = require('./models.js');

module.exports = React.createClass({
  displayName: 'exports',

  handleLogin: function handleLogin(result) {
    console.log(result);
    models.startLogin(result.accessToken, this.props.onLoginComplete, function () {});
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
  },
  render: function render() {
    return React.createElement(
      FacebookLogin,
      {
        appId: '175370155978273',
        'class': 'facebook-login',
        scope: 'public_profile',
        autoLoad: true,
        loginHandler: this.handleLogin },
      React.createElement(
        'div',
        { id: 'login' },
        React.createElement('div', { id: 'splash' }),
        React.createElement(
          'div',
          { id: 'slogan' },
          React.createElement('img', { src: 'images/slogan.png' })
        ),
        React.createElement(
          'div',
          { id: 'loginButton' },
          React.createElement('img', { src: 'images/login-button.png', id: 'loginButtonImg' })
        )
      )
    );
  }
});
