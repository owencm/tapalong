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
      // This is async so resolve once it's done and the notifications are showing
      showNotificationsIfNotShownPreviously(notifications, resolve);
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
    self.registration.pushManager.getSubscription().then(function(subscription) {
      if (subscription) {
        var subscriptionId = subscription.subscriptionId;
        fetch('/../v1/notifications/for/'+subscriptionId, {
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
      } else {
        console.log('Was asked to get notifications before a subscription was created!')
      }
    });
  });
}

self.addEventListener('notificationclick', function(e) {
  log('notificationclick listener', e);
  e.waitUntil(handleNotificationClick(e));
});

//Utility function to handle the click
function handleNotificationClick(e) {
  log('Notification clicked: ', e.notification);
  e.notification.close();
  return clients.matchAll({
      type: 'window',
      includeUncontrolled: false
  }).catch(function(ex) {
      console.log(ex);
  }).then(function(clientList) {
      return clients.openWindow(e.notification.url);
  });
}

function showNotificationsIfNotShownPreviously(notifications, success) {
  var db = objectDB.open('db-1');
  db.get().then(function(data)  {
    console.log('data', data);
    if (data.notificationIds == undefined ) {
      console.log('data.notificationIds was blank')
      data.notificationIds = [];
    }
    for (var i = 0; i < notifications.length; i++) {
      var note = notifications[i];
      if (data.notificationIds.indexOf(note.id) < 0) {
        console.log('havent shown note '+note.id+' before');
        data.notificationIds.push(note.id);
        showNotification(note.title, note.body, note.url, note.icon, note.id);
      } else {
        console.log('we showed note '+note.id+' previously so skip it');
      }
    }
    db.put('notificationIds', data.notificationIds);
    success();
  });
}

//Utility function to actually show the notification.
function showNotification(title, body, url, icon, tag) {
  var options = {
    body: body,
    tag: tag,
    // lang: 'test lang',
    icon: icon,
    data: {url: url},
    vibrate: 1000,
    noscreen: false
  };
  if (self.registration && self.registration.showNotification) {
    // TODO: ensure this works after the page is closed
    self.registration.showNotification(title, options);
  }
}