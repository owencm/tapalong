// TODO: make sure this all works in browsers without SW support. Checks are half baked today.
var reg;
var swLibrary = (function() {
  var browserSupportsSW = false;
  if ('serviceWorker' in navigator) {
    browserSupportsSW = true
  }

  var hasPushNotificationPermission = function(success, failure) {
    if (!browserSupportsSW) {
      failure();
      return;
    }
    var status = Notification.permission;
    if (status !== 'granted') {
      failure();
    } else {
      success();
    }
  };

  // Calls success with either 'granted' or 'denied'
  var requestPushNotificationPermission = function (success) {
    console.log('Requesting push permission');
    Notification.requestPermission(success);
  };

  var requestPushNotificationPermissionAndSubscribe = function (success) {
    requestPushNotificationPermission(function(decision){
      if (decision == 'granted') {
        subscribeForPushNotifications(sendSubscriptionToServer);
      }
      success(decision);
    });
  }

  var sendSubscriptionToServer = function (subscription) {
    network.requestCreatePushNotificationsSubscription(subscription);
  };

  var subscribeForPushNotifications = function (callback) {
    navigator.serviceWorker.ready.then(function(registration) {
      console.log('Registering for push');
      registration.pushManager.subscribe()
        .then(function(pushSubscription) {
          console.log('Subscription succeeded', pushSubscription);
          callback(pushSubscription);
        }, function (e) {
          console.log('registering for push failed', e);
        });
    });
  };

  var unsubscribe = function (subscription, callback) {
    subscription.unsubscribe().then(function(){
      console.log('Unsubscribed');
      callback();
    }, function () {
      console.log('Unregistration failed');
    });
  };

  var sendMessageToSW = function (message, callback) {
    var messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = function(event) {
      callback(event.data);
    };
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
      console.log('Sent message to service worker: ',message);
    } else {
      throw Error('No service worker exists, can\'t send a message');
    }
  };

  var _unsubscribeAndResubscribe = function () {
    navigator.serviceWorker.ready.then(function(registration){
      registration.pushManager.getSubscription().then(function(pushSubscription){
        if (pushSubscription) {
          unsubscribe(pushSubscription, function(){subscribeForPushNotifications(sendSubscriptionToServer);});
        } else {
          console.log('no subscription to unsubscribe');
          subscribeForPushNotifications(sendSubscriptionToServer);
        }
      });
    });
  }

  var init = function () {
    if (browserSupportsSW) {
      navigator.serviceWorker.register('./sw.js').then(function(registration) {
        // Registration was successful
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      });
    }

    // Ensure the SW always knows who the user is and what their sessionToken is!
    // TODO: Handle logout here where we have no userid or session token
    // Note these will fire whenever either changes, so if both change this will fire twice
    var userChanged = function() {
      var userId = models.user.getUserId();
      var sessionToken = models.user.getSessionToken();
      navigator.serviceWorker.ready.then(function(registration) {
        hasPushNotificationPermission(function () {
          if (userId !== undefined && sessionToken !== undefined) {
            registration.pushManager.getSubscription().then(function(pushSubscription) {
              if (!pushSubscription) {
                console.log('ruh roh, we lost our push subscription (or we never managed to make one - were you offline?). Better make a new one...');
                subscribeForPushNotifications(sendSubscriptionToServer);
              }
            });
          }
        }, function () {
          // If we don't have permission for push messages make sure we've cleared subscriptions (Chrome has a bug where it doesn't do this)
          registration.pushManager.getSubscription().then(function(pushSubscription) {
            if (pushSubscription) { unsubscribe(pushSubscription); }
          });
        });
      });
    };
    userChanged();
    models.user.addListener(userChanged);
  }

  init();

  return {
    hasPushNotificationPermission: hasPushNotificationPermission,
    requestPushNotificationPermissionAndSubscribe: requestPushNotificationPermissionAndSubscribe,
    _unsubscribeAndResubscribe: _unsubscribeAndResubscribe
  }
})();