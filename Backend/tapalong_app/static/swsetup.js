if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(function(registration) {
    // Registration was successful
    console.log('ServiceWorker registration successful with scope: ', registration.scope);

    // Check if we have permission for push messages already
    registration.pushManager.hasPermission().then(function(pushPermissionStatus) {

      // If we don't have permission then set the UI accordingly
      if (pushPermissionStatus !== 'granted') {
        if (confirm('UpDog can notify you when a friend says they want to join in with one of your plans.')) {
          requestPushPermission();
        }
        return;
      }

      // We have permission, lets just check it out
      registration.pushManager.getSubscription().then(function(pushSubscription) {
        if (pushSubscription) {
          console.log('We have a pre existing push subscription. Lets send it to the server for good measure');
          sendSubscription(pushSubscription);
        } else {
          console.log('ruh roh, we lost our push registration. Better make a new one...');
          registerForPush(registration);
        }
      });
 		});
  });
}

function requestPushPermission() {
  navigator.serviceWorker.ready.then(function(registration) {
    registerForPush(registration);
  });
}

function registerForPush(registration) {
  registration.pushManager.subscribe()
    .then(function(pushSubscription) {
      sendSubscription(pushSubscription);
    }, function () {
      console.log('registering for push failed');
    });
}

function sendSubscription(subscription) {
  console.log(subscription);
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
  navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
}
