var skipLogin = true;

if (skipLogin) {  
  // view.debugSkipLogin(1, 'Ally Gale', 'letmein');
  view.debugSkipLogin(2, 'Owen Campbell-Moore', 'letmein');
  // view.debugSkipLogin(3, 'Tyler Rigsby', 'letmein');
} else {
  // This loads the facebook SDK async, then calls window.fbAsyncInit. FB.getLoginStatus does the logging in, and statusChangeCallback is as expected.

  // This is called with the results from from FB.getLoginStatus().
  function statusChangeCallback(response) {
    if (response.status === 'connected') {
      // Logged into your app and Facebook.
      view.fbLoginSuccess(response.authResponse.accessToken);
    } else if (response.status === 'not_authorized') {
      // The person is logged into Facebook, but not your app.
    } else {
      // The person is not logged into Facebook, so we're not sure if
      // they are logged into this app or not.
    }
  }

  window.fbAsyncInit = function() {
    FB.init({
      appId      : '175370155978273',
      cookie     : true,  // enable cookies to allow the server to access 
                          // the session
      xfbml      : false,  // parse social plugins on this page
      version    : 'v2.0' // use version 2.0
    });

    // This is called once everything is initialized and you are able to attempt to login
    view.setLoginButtonCallback(function () {
      FB.getLoginStatus(function(response) {
        statusChangeCallback(response);
      });
    });
  };

  // Load the SDK asynchronously
  (function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));
}