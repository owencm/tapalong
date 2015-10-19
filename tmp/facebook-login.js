'use strict';

var React = require('react');

var FacebookLogin = React.createClass({
  displayName: 'FacebookLogin',

  render: function render() {
    var _this = this;

    // Clone the children so we can set props on them indicating the state of the login process
    var children = React.Children.map(this.props.children, function (child) {
      return React.cloneElement(child, { readyToLogin: _this.state.readyToLogin });
    });
    return React.createElement(
      'div',
      { onClick: this.handleClick },
      children,
      React.createElement('div', { id: 'fb-root' })
    );
  },

  getInitialState: function getInitialState() {
    return {
      readyToLogin: false,
      fbResponse: undefined
    };
  },

  componentDidMount: function componentDidMount() {

    window.fbAsyncInit = (function () {
      FB.init({
        appId: this.props.appId || '',
        xfbml: this.props.xfbml || false,
        version: 'v2.3'
      });

      if (this.props.autoLoad) {

        FB.getLoginStatus((function (response) {
          this.setState({ readyToLogin: true, fbResponse: response });
          // TODO: Enable UI here
        }).bind(this));
      }
    }).bind(this);

    // Load the SDK asynchronously
    (function (d, s, id) {
      var js,
          fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) {
        return;
      }
      js = d.createElement(s);js.id = id;
      js.src = "//connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    })(document, 'script', 'facebook-jssdk');
  },

  checkLoginState: function checkLoginState(response) {
    if (response.authResponse) {

      this.props.loginHandler(response.authResponse);
    } else {

      var valueScope = this.props.scope || 'public_profile, email, user_birthday';
      // TODO: Don't allow this to recurse
      FB.login(this.checkLoginState, { scope: valueScope });

      // If we failed trying to log in automatically, let the user take an action
      // if ( this.props.loginHandler ) {
      //   this.props.loginHandler( { status: response.status } );
      // }
    }
  },

  handleClick: function handleClick() {
    if (this.state.fbResponse) {
      this.checkLoginState(this.state.fbResponse);
    }
  }
});

module.exports = FacebookLogin;
//# sourceMappingURL=facebook-login.js.map
