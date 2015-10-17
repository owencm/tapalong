var React = require('react');

module.exports = React.createClass({

  render: function() {
    return (
      <div onClick={ this.handleClick }>
        { this.props.children }
        <div id="fb-root"></div>
      </div>
    )
  },

  componentDidMount: function() {

    window.fbAsyncInit = function() {
      FB.init({
        appId      : this.props.appId || '',
        xfbml      : this.props.xfbml || false,
        version    : 'v2.3'
      });

      if ( this.props.autoLoad ) {

        FB.getLoginStatus(function(response) {
          this.checkLoginState(response);
        }.bind(this));

      }

    }.bind(this);

    // Load the SDK asynchronously
    (function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "//connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
   }(document, 'script', 'facebook-jssdk'));
  },

  checkLoginState: function(response) {
    if (response.authResponse) {

      this.props.loginHandler(response.authResponse);

    } else {

      // If we failed trying to log in automatically, let the user take an action
      // if ( this.props.loginHandler ) {
      //   this.props.loginHandler( { status: response.status } );
      // }

    }
  },

  handleClick: function() {
    var valueScope = this.props.scope || 'public_profile, email, user_birthday';

    FB.login(this.checkLoginState, { scope: valueScope });
  }
});
