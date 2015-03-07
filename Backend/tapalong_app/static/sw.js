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
        showNotificationIfNotShownPreviously(note.title, note.body, note.url, note.icon, note.id);
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

function showNotificationIfNotShownPreviously(title, body, url, icon, tag) {
  var db = objectDB.open('db-1');
  db.get().then(function(data)  {
    console.log('data', data);
    if (data.tags == undefined ) {
      console.log('data.tags was blank')
      data.tags = [];
    }
    if (data.tags.indexOf(tag) < 0) {
      data.tags.push(tag);
      console.log('data.tags',data.tags)
      // This is not finishing before we do the next one in the for loop and read again :(
      db.put('tags', data.tags);
      showNotification(title, body, url, icon, tag);
    }
  });
}

//Utility function to actually show the notification.
function showNotification(title, body, url, icon, tag) {
  var options = {
    body: body,
    tag: tag,
    // lang: 'test lang',
    icon: 'images/icon.png',
    data: {url: url},
    vibrate: 1000,
    noscreen: false
  };
  if (self.registration && self.registration.showNotification) {
    // TODO: ensure this works after the page is closed
    self.registration.showNotification(title, options);
  }
}