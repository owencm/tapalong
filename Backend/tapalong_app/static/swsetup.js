var swLibrary = (function() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(function(registration) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);

      // Check if we have permission for push messages already
      registration.pushManager.hasPermission().then(function(pushPermissionStatus) {

        // If we don't have permission then set the UI accordingly
        if (pushPermissionStatus !== 'granted') {
          registration.pushManager.getSubscription().then(function(pushSubscription) {
            if (pushSubscription) {
              unsubscribe(pushSubscription);
            }
          });
          return;
        }

        // We have permission, lets just check it out
        registration.pushManager.getSubscription().then(function(pushSubscription) {
          if (pushSubscription) {
            console.log('We have a pre existing push subscription. Lets send it to the server for good measure');
            sendSubscription(pushSubscription);
          } else {
            console.log('ruh roh, we lost our push registration (or we never managed to make one - were you offline?). Better make a new one...');
            registerForPushNotifications(function() {});
          }
        });
   		});
    });
  }

  function hasPushPermission(success, failure) {
    navigator.serviceWorker.getRegistration().then(function(registration) {
      registration.pushManager.hasPermission().then(function(pushPermissionStatus) {
        if (pushPermissionStatus !== 'granted') {
          failure();
        } else {
          success();
        }
      });
    });
  }

  // Calls callback with either 'granted' or 'denied'
  function requestPushNotificationPermission(callback) {
    console.log('Requesting push permission');
    Notification.requestPermission(callback);
  }

  function registerForPushNotifications(callback) {
    navigator.serviceWorker.ready.then(function(swRegistration) {
      console.log('Registering for push');
      swRegistration.pushManager.subscribe()
        .then(function(pushSubscription) {
          console.log('Subscription succeeded');
          sendSubscription(pushSubscription);
          callback();
        }, function (e) {
          console.log('registering for push failed', e);
        });
    });
  }

  function sendSubscription(subscription) {
    console.log('Now we\'d send the subscription to the server', subscription);
    
    // Here we would send this to the server
  }

  function unsubscribe(subscription) {
    subscription.unsubscribe().then(function(){
      console.log('Unsubscribed');
    }, function () {
      console.log('Unregistration failed');
    });
  }

  function sendMessage(message, callback) {
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
  }

  function setUserIdInSW(newUserId) {
    sendMessage({userId: newUserId}, function () {});
  }

  function setSessionTokenInSW(newToken) {
    sendMessage({sessionToken: newToken}, function () {});
  }
})();