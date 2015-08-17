var skipLogin = true;

if (skipLogin) {
  // view.debugSkipLogin(5, 'Ally Gale', 'letmein');
  view.debugSkipLogin(1, 'Owen Campbell-Moore', 'letmein');
  // view.debugSkipLogin(3, 'Tyler Rigsby', 'letmein');
} else {
  // This loads the facebook SDK async, then calls window.fbAsyncInit. FB.getLoginStatus does the logging in, and statusChangeCallback is as expected.

  // This is called with the results from from FB.getLoginStatus().
  function statusChangeCallback(response) {
    if (response.status === 'connected') {
      // Logged into your app and Facebook.
      view.fbLoginSuccess(response.authResponse.accessToken);
    } else if (response.status === 'not_authorized') {
      console.log('user hasnt authorized the app');
      FB.login(statusChangeCallback);
      // The person is logged into Facebook, but not your app.
    } else {
      FB.login(statusChangeCallback);
      // The person is not logged into Facebook, so we're not sure if
      // they are logged into this app or not.
    }
  }

  window.fbAsyncInit = function() {
    FB.init({
      appId      : '175370155978273',
      xfbml      : false,  // parse social plugins on this page
      version    : 'v2.3'
    });

    FB.getLoginStatus(function(response) {
      // This is called once everything is initialized and you are able to attempt to login
      view.setLoginButtonCallback(function () {
          statusChangeCallback(response);
      });
    });
  };

  // Load the SDK asynchronously
  (function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) { return };
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));


}