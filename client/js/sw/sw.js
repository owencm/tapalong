'use strict';
var objectDB = require('./objectdb.js');

var version = 1;
var logging = true;

var log = function () {
  if (logging) {
    console.log.apply(console, arguments);
  }
}

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
    getNotifications().then(function (notifications) {
      // This is async so resolve once it's done and the notifications are showing
      notifications = notifications.filter((notification)=>{
        return (notification.fetched_previously == false);
      });
      notShownOnThisClientBefore(notifications).then((notifications) => {
        return showNotifications(notifications);
      }).then(resolve);
    }, function (reason) {
      reject(reason);
    });
  }));
});

function getNotifications() {
  return new Promise((resolve, reject) => {
    // Get the session tokens etc from IDB
    var db = objectDB.open('db-1');
    // Note objectDB does not use actual promises so we can't properly chain this
    db.get().then(function(data) {
      var sessionToken = data.sessionToken;
      var userId = data.userId;
      if (sessionToken == undefined || userId == undefined) {
        throw new Error('User was not logged in. Cannot request notifications.');
      }
      // TODO: Unify networking library with main app
      fetch('/../v1/notifications/', {
        headers: {
          'Session-Token': sessionToken,
          'User-Id': userId
        }
      }).then(function(response) {
      return response.text();
      }).then(function(txt) {
        var notifications = JSON.parse(txt);
        log('Fetched notifications: ', notifications);
        resolve(notifications);
      }).catch(function(ex) {
        reject();
        console.log(ex);
      });
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
      return clients.openWindow(e.notification.data.url);
  });
}

function notShownOnThisClientBefore(notifications) {
  return new Promise((resolve, reject) => {
    var result = [];
    var db = objectDB.open('db-1');
    db.get().then(function(data)  {
      console.log('Database of previously shown notification IDs: ', data);
      for (var i = 0; i < notifications.length; i++) {
        var note = notifications[i];
        if (data.notificationIds.indexOf(note.id) < 0) {
          console.log('This client hasn\t shown notification '+note.id+' before');
          result.push(note);
        }
      }
      resolve(result);
    });
  });
}

function showNotifications(notifications) {
  return new Promise((resolve, reject) => {
    var db = objectDB.open('db-1');
    db.get().then(function(data)  {
      if (data.notificationIds == undefined ) {
        console.log('SW has never shown a notification before. Creating state in DB.')
        data.notificationIds = [];
      }
      for (var i = 0; i < notifications.length; i++) {
        var note = notifications[i];
        showNotification(note.title, note.body, note.url, note.icon, note.id);
        // We only show notifications never shown before, so we will never add the same ID here twice
        data.notificationIds.push(note.id);
      }
      // Note objectDB does not use real promises so we can't chain this
      db.put('notificationIds', data.notificationIds).then(() => {
        // Resolve one second late just in case it took a while to show the notifications earlier
        // TODO: Move the resolve to happen after at least one showNotification promise has resolved
        setTimeout(resolve, 1000);
      });
    });
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
