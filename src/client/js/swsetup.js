// TODO: Move network calls into Redux thunks
// TODO: Rewrite to use promises. And tidy the crap up.
// TODO: make sure this all works in browsers without SW support. Checks are half baked today.
import network from './network.js';
import persistence from './persistence.js';

let browserSupportsSWAndNotifications = function () {
  return ('serviceWorker' in navigator && typeof Notification !== 'undefined');
}

let hasPushNotificationPermission = function(success, failure) {
  if (!browserSupportsSWAndNotifications()) {
    failure();
    return;
  }
  let status = Notification.permission;
  if (status !== 'granted') {
    failure();
  } else {
    success();
  }
};

let requestPushNotificationPermission = function (success, failure) {
  console.log('Requesting push permission');
  Notification.requestPermission(function (decision) {
    console.log(decision);
    if (decision == 'granted') {
      success();
    } else {
      failure();
    }
  });
};

let requestPushNotificationPermissionAndSubscribe = function (user, success, failure) {
  requestPushNotificationPermission(() => {
    subscribeForPushNotifications((subscription) => {
      sendSubscriptionToServer(user, subscription);
    });
    success();
  }, () => {
    // TODO: Handle failure
    failure();
  });
}

let sendSubscriptionToServer = function (user, subscription) {
  // Reconstructing this object to avoid https://code.google.com/p/chromium/issues/detail?id=467366 (still neccessary as of Chrome 45)
  subscription = {endpoint: subscription.endpoint};
  // Parse the GCM subscriptionId out of end endpoint as that is what GCM needs
  // TODO: Just send up the endpoint and parse on the server
  subscription.subscriptionId = subscription.endpoint.slice(subscription.endpoint.indexOf('send/')+5, subscription.endpoint.length);
  network.requestCreatePushNotificationsSubscription(user, subscription);
};

let subscribeForPushNotifications = function (callback) {
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

let unsubscribe = function (subscription, callback) {
  subscription.unsubscribe().then(function(){
    console.log('Unsubscribed');
    callback();
  }, function () {
    console.log('Unregistration failed');
  });
};

let sendMessageToSW = function (message, callback) {
  let messageChannel = new MessageChannel();
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

let _unsubscribeAndResubscribe = function () {
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

let init = function () {
  if (browserSupportsSWAndNotifications()) {
    navigator.serviceWorker.register('./service-worker.js').then(function(registration) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    });
    persistence.isLoggedIn().then((user) => {
      return registration.pushManager.getSubscription()
    }).then(function(pushSubscription) {
      if (!pushSubscription) {
        console.log('ruh roh, we lost our push subscription (or we never managed to make one - were you offline?). Better make a new one...');
        subscribeForPushNotifications(sendSubscriptionToServer);
      }
    }).catch((e) => {

    });
  //   // If we don't have permission for push messages make sure we've cleared subscriptions (Chrome has a bug where it doesn't do this)
  //   registration.pushManager.getSubscription().then(function(pushSubscription) {
  //     if (pushSubscription) { unsubscribe(pushSubscription); }
  //   });
  // });
  }
}

module.exports = {
  init,
  browserSupportsSWAndNotifications,
  hasPushNotificationPermission,
  requestPushNotificationPermissionAndSubscribe,
  _unsubscribeAndResubscribe
}
