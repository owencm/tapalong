// TODO: Move network calls into Redux thunks
// TODO: Rewrite to use promises. And tidy the crap up.
// TODO: make sure this all works in browsers without SW support. Checks are half baked today.
import network from './network.js';
import persistence from './persistence.js';

const browserSupportsSWAndNotifications = function () {
  return ('serviceWorker' in navigator && typeof Notification !== 'undefined');
}

const hasPushNotificationPermission = function(success, failure) {
  if (!browserSupportsSWAndNotifications()) {
    failure();
    return;
  }
  const status = Notification.permission;
  if (status !== 'granted') {
    failure();
  } else {
    success();
  }
};

const requestPushNotificationPermissionAndSubscribe = function (user, success, failure) {
  Notification.requestPermission().then((decision) => {
    if (decision !== 'granted') {
      throw new Error('User denied permission to receive push');
    }
    success();
    return subscribeForPushNotifications();
  }).then((subscription) => {
    return sendSubscriptionToServer(user, subscription);
  }).catch((err) => {
    failure();
  });
}

const sendSubscriptionToServer = function (user, subscription) {
  // TODO: handle browsers without key support
  const subscriptionIntermediate = JSON.parse(JSON.stringify(subscription));
  const subscriptionWithKeys = {
    endpoint: subscriptionIntermediate.endpoint,
    encodedKeys: {
      p256dh: subscriptionIntermediate.keys.p256dh,
      auth: subscriptionIntermediate.keys.auth
    }
  };
  network.requestCreatePushNotificationsSubscription(user, subscriptionWithKeys);
};

const subscribeForPushNotifications = () => {
  return navigator.serviceWorker.ready.then((registration) => {
    console.log('Registering for push');
    return registration.pushManager.subscribe({userVisibleOnly: true});
  }).then((pushSubscription) => {
    console.log('Subscription succeeded', JSON.parse(JSON.stringify(pushSubscription)));
    return pushSubscription;
  });
};

const unsubscribe = function (subscription, callback) {
  subscription.unsubscribe().then(function(){
    console.log('Unsubscribed');
    callback();
  }, function () {
    console.log('Unregistration failed');
  });
};

// const sendMessageToSW = function (message, callback) {
//   const messageChannel = new MessageChannel();
//   messageChannel.port1.onmessage = function(event) {
//     callback(event.data);
//   };
//   if (navigator.serviceWorker.controller) {
//     navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
//     console.log('Sent message to service worker: ',message);
//   } else {
//     throw Error('No service worker exists, can\'t send a message');
//   }
// };

// const _unsubscribeAndResubscribe = function () {
//   return navigator.serviceWorker.ready.then((registration) => {
//     return registration.pushManager.getSubscription();
//   }).then(function(pushSubscription){
//     if (pushSubscription) {
//       unsubscribe(pushSubscription, () => { subscribeForPushNotifications().then(sendSubscriptionToServer) });
//     } else {
//       console.log('no subscription to unsubscribe');
//       subscribeForPushNotifications().then(sendSubscriptionToServer);
//     }
//   });
// }
//
// window._unsubscribeAndResubscribe = _unsubscribeAndResubscribe;

const init = function () {
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
        subscribeForPushNotifications().then(sendSubscriptionToServer);
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
}
