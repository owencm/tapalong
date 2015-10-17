// Require react, convenience libraries and UI components
var React = require('react');
var m = require('./m.js');
var FacebookLogin = require('./facebook-login.js');

// Require core logic
var models = require('./models.js');

module.exports = React.createClass({
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
  },
  render: function () {
    // <div id='login'>
    //   <div id='splash'>
    //   </div>
    //   <div id='slogan'>
    //     <img src='images/slogan.png'></img>
    //   </div>
    //   <div id='loginButton' onClick={this.handleLogin}>
    //     <img src='images/login-button.png' id='loginButtonImg'></img>
    //   </div>
    // </div>
    return (
      <FacebookLogin
        appId='175370155978273'
        class='facebook-login'
        scope='public_profile'
        loginHandler={ this.handleLogin } >
        <p>Hello world</p>
      </FacebookLogin>
    )
  }
});
