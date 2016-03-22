'use strict';
var persistence = require('../persistence.js');

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
  return persistence.isLoggedIn().then(({userId, userName, sessionToken}) => {
    // TODO: Unify networking library with main app
    return fetch('/../v1/notifications/', {
      headers: {
        'Session-Token': sessionToken,
        'User-Id': userId
      }
    });
  }).then((response) => {
    return response.text();
  }).then((json) => {
    var notifications = JSON.parse(json);
    log('Fetched notifications: ', notifications);
    return notifications;
  }).catch(function(ex) {
    console.log(ex);
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
  return persistence.getPreviouslyShownNotifications().then((shownNotificationIds) => {
    var result = [];
    console.log('Database of previously shown notification IDs: ', shownNotificationIds);
    for (var i = 0; i < notifications.length; i++) {
      var note = notifications[i];
      if (shownNotificationIds.indexOf(note.id) < 0) {
        console.log('This client hasn\t shown notification '+note.id+' before');
        result.push(note);
      }
    }
    return result;
  });
}

function showNotifications(notifications) {
  return new Promise((resolve, reject) => {
    persistence.getPreviouslyShownNotifications().then((shownNotificationIds) => {
      let newShownNotificationIds = [];
      for (var i = 0; i < notifications.length; i++) {
        var note = notifications[i];
        showNotification(note.title, note.body, note.url, note.icon, note.id);
        // We only show notifications never shown before, so we will never add the same ID here twice
        newShownNotificationIds.push(note.id);
      }
      persistence.markNotificationsAsShown(newShownNotificationIds);
      // Resolve five second late just in case it took a while to show the notifications earlier
      // TODO: Move the resolve to happen after at least one showNotification promise has resolved
      setTimeout(resolve, 5000);
    });
  })
}

//Utility function to actually show the notification.
function showNotification(title, body, url, icon, tag) {
  var options = {
    body: body,
    tag: tag,
    // lang: 'en',
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
