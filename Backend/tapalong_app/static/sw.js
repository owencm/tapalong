'use strict';

var version = 1;
var logging = true;
var log = function () {
  if (logging) {
    console.log.apply(console, arguments);
  }
}
var userId;
var sessionToken;

self.addEventListener('install', function(e) {
    //Automatically take over the previous worker.
    e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function(e) {
  log('Activated ServiceWorker version: ' + version);
});

//Handle the push received event.
self.addEventListener('push', function(e) {
  log('push listener', e);
  e.waitUntil(new Promise(function(resolve, reject) {
    fetch('/../v1/notifications/', {
      headers: {
        'SESSION_TOKEN': sessionToken,
        'USER_ID': userId
      }
    }).then(function(response) {
      response.text().then(function(txt) {
        log('fetched notifications', txt);
        var json = JSON.parse(txt);
        for (var i = 0; i < json.notifications.length; i++) {
          var note = json.notifications[i];
          log('Showing notification: ' + note.body);
          showNotification(note.title, note.body, note.url, note.id);
        }
        resolve();
      }).catch(function(reason){reject(reason);});
    }).catch(function(reason){reject(reason);});
  }));
});

self.addEventListener('notificationclick', function(e) {
  log('notificationclick listener', e);
  e.waitUntil(handleNotificationClick(e));
});

self.addEventListener('message', function (e) {
  log('postMessage received', e.data);
  if (e.data.sessionToken) {
    // TODO: store in idb
    sessionToken = e.data.sessionToken;
  } else if (e.data.userId) {
    // TODO: store in idb
    userId = e.data.userId;
  } else {
    self.push();
  }
  e.ports[0].postMessage({success: 'true'});
})

//Utility function to handle the click
function handleNotificationClick(e) {
  log('Notification clicked: ', e.notification);
  e.notification.close();
  return clients.getAll({
      type: 'window',
      includeUncontrolled: false
  }).catch(function(ex) {
      console.log(ex);
  }).then(function(clientList) {
      return clients.openWindow(e.notification.url);
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