// TODO: make sure this all works in browsers without SW support. Checks are half baked today.
var models = require('./models.js');
var network = require('./network.js');

var browserSupportsSWAndNotifications = function () {
  return ('serviceWorker' in navigator && typeof Notification !== 'undefined');
}

var hasPushNotificationPermission = function(success, failure) {
  if (!browserSupportsSWAndNotifications()) {
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

var requestPushNotificationPermission = function (success, failure) {
  console.log('Requesting push permission');
  Notification.requestPermission(function (decision) {
    if (decision == 'granted') {
      success();
    } else {
      failure();
    }
  });
};

var requestPushNotificationPermissionAndSubscribe = function (success, failure) {
  requestPushNotificationPermission(function(){
    subscribeForPushNotifications(sendSubscriptionToServer);
    success();
  }, function () {
    // TODO: Handle failure
    failure();
  });
}

var sendSubscriptionToServer = function (subscription) {
  // Reconstructing this object to avoid https://code.google.com/p/chromium/issues/detail?id=467366 (still neccessary as of Chrome 45)
  var subscription = {endpoint: subscription.endpoint};
  // Parse the GCM subscriptionId out of end endpoint as that is what GCM needs
  subscription.subscriptionId = subscription.endpoint.slice(subscription.endpoint.indexOf('send/')+5, subscription.endpoint.length);
  network.requestCreatePushNotificationsSubscription(models.user, subscription);
};

var subscribeForPushNotifications = function (callback) {
  navigator.serviceWorker.ready.then(function(registration) {
    console.log('Registering for push');
    registration.pushManager.subscribe({userVisibleOnly: true})
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
  if (browserSupportsSWAndNotifications()) {
    navigator.serviceWorker.register('./sw.js').then(function(registration) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    });
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
}

init();

module.exports = {
  browserSupportsSWAndNotifications: browserSupportsSWAndNotifications,
  hasPushNotificationPermission: hasPushNotificationPermission,
  requestPushNotificationPermissionAndSubscribe: requestPushNotificationPermissionAndSubscribe,
  _unsubscribeAndResubscribe: _unsubscribeAndResubscribe
}
