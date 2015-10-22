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
  }
});

var LoginInner = React.createClass({
  // Note not using arrow functions as that causes this to be undefined
  render: function () {
    // TODO: use this.props.readyToLogin to modify the rendering
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
        { this.props.readyToLogin ?
          (
            <div id='loginButton'>
              <img src='images/login-button.png' id='loginButtonImg'></img>
            </div>
          ) : null }
      </div>
    );
  }
});

module.exports = Login;
