'use strict';

importScripts('objectdb.js');
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
    getNotifications(function (notifications) {
      notifications.map(function(note) {
        showNotification(note.title, note.body, note.url, note.id);
      });
      resolve();
    }, function (reason) {
      reject(reason);
    });
  }));
});

function getNotifications(resolve, reject) {
  // Get the session tokens etc from IDB
  var db = objectDB.open('db-1');
  db.get().then(function(data) {
    var sessionToken = data.sessionToken;
    var userId = data.userId;
    if (sessionToken == undefined || userId == undefined) {
      throw new Error('User was not logged in. Cannot request notifications.');
    }
    fetch('/../v1/notifications/', {
      headers: {
        'SESSION_TOKEN': sessionToken,
        'USER_ID': userId
      }
    }).then(function(response) {
      response.text().then(function(txt) {
        log('fetched notifications', txt);
        var notifications = JSON.parse(txt);
        resolve(notifications);
      }).catch(reject)
    }).catch(reject);
  });
}

function showNewNotifications() {
  getNotifications(function (notifications) {
    console.log('got notifications!');
    notifications.map(function(note) {
      showNotification(note.title, note.body, note.url, note.id);
    });
  }, function (reason) {
    console.log('Failed to show notifications because '+reasons);
  });
}

self.addEventListener('notificationclick', function(e) {
  log('notificationclick listener', e);
  e.waitUntil(handleNotificationClick(e));
});

self.addEventListener('message', function (e) {
  log('postMessage received', e.data);
  if (e.data.showNotifications) {
    showNewNotifications();
  } else {
    throw Error('Unrecognised postmessage')
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

showNewNotifications();