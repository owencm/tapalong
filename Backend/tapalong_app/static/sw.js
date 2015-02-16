'use strict';

var version = 1;
var logging = true;
var log = function () {
  if (logging) {
    console.log.apply(console, arguments);
  }
}

self.addEventListener('install', function(evt) {
    //Automatically take over the previous worker.
    evt.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function(evt) {
  log('Activated ServiceWorker version: ' + version);
});

//Handle the push received event.
self.addEventListener('push', function(evt) {
    console.log('push received');
    log('push listener', evt);
    evt.waitUntil(new Promise(function(resolve, reject) {
        self.registration.pushManager.getSubscription().then(function(subscription) {
          fetch('notifications.json', {
            headers: {
              'SESSION_TOKEN': 'letmein'
            }
          }).then(function(response) {
            // fetch('/notifications?version=' + version + '&subscriptionId=' + subscription.subscriptionId).then(function(response) {
                response.text().then(function(txt) {
                    log(txt);
                    var json = JSON.parse(txt);
                    for (var i = 0; i < json.notifications.length; i++) {
                        var note = json.notifications[i];
                        log('Showing notification: ' + note.body);
                        showNotification(note.title, note.body, note.url, note.id);
                    }
                    resolve();
                }).catch(function(reason){reject(reason);});
            }).catch(function(reason){reject(reason);});
            return subscription;
        }).catch(function(reason){reject(reason);});
    }));
});

self.addEventListener('notificationclick', function(evt) {
  log('notificationclick listener', evt);
  evt.waitUntil(handleNotificationClick(evt));
});

self.addEventListener('message', function (evt) {
  log('postMessage received', evt.data);
  evt.ports[0].postMessage(evt.data);
})

//Utility function to handle the click
function handleNotificationClick(evt) {
  log('Notification clicked: ', evt.notification);
  evt.notification.close();
  return clients.getAll({
      type: 'window',
      includeUncontrolled: false
  }).catch(function(ex) {
      console.log(ex);
  }).then(function(clientList) {
      return clients.openWindow(evt.notification.tag);
  });
}

//Utility function to actually show the notification.
function showNotification(title, body, url, tag) {
  var options = {
    body: body,
    tag: tag,
    // lang: 'test lang',
    icon: 'icon.png',
    data: {url: url},
    vibrate: 1000,
    noscreen: false
  };
  if (self.registration && self.registration.showNotification) {
    // TODO: ensure this works after the page is closed
    self.registration.showNotification(title, options);
  }
}