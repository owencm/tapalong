'use strict';
// var persistence = require('../persistence.js');

const version = 1;
const logging = true;

const log = function () {
  if (logging) {
    console.log.apply(console, arguments);
  }
}

self.addEventListener('install', function(e) {
    // Automatically take over the previous worker.
    e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function(e) {
  log('Activated ServiceWorker version: ' + version);
});

self.addEventListener('push', function(event) {
  const data = event.data && event.data.json();
  log('Received a push', event, data);
  const notification = {
    title: data.title || 'Up Dog',
    body: data.body || 'New content available',
    url: data.url || '/',
    tag: data.tag || 'static',
  }
  event.waitUntil(showNotification(notification));
});

self.addEventListener('notificationclick', (e) => {
  e.waitUntil(handleNotificationClick(e));
});

// Utility function to actually show the notification.
const showNotification = (note) => {
  const options = {
    body: note.body,
    tag: note.tag,
    // lang: 'en',
    icon: note.icon || 'images/icon-192.png',
    data: { url: note.url },
    vibrate: 1000,
    noscreen: false,
    renotify: true
  };
  return self.registration.showNotification(note.title, options);
}

// Utility function to handle the click
const handleNotificationClick = (e) => {
  log('Notification clicked ', e);
  e.notification.close();
  return clients.matchAll({
      type: 'window',
      includeUncontrolled: false
  }).then(function(clientList) {
      return clients.openWindow(e.notification.data.url);
  }).catch(function(error) {
      console.error(error);
  });
}

// Old code that fetched the notifications from the server
// Handle the push received event.
// self.addEventListener('push', function(e) {
//   log('push listener', e);
//   e.waitUntil(new Promise(function(resolve, reject) {
//     getNotifications().then(function (notifications) {
//       // This is async so resolve once it's done and the notifications are showing
//       notifications = notifications.filter((notification)=>{
//         return (notification.fetched_previously == false);
//       });
//       notShownOnThisClientBefore(notifications).then((notifications) => {
//         return showNotifications(notifications);
//       }).then(resolve);
//     }, function (reason) {
//       reject(reason);
//     });
//   }));
// });

// function getNotifications() {
//   return persistence.isLoggedIn().then(({userId, userName, sessionToken}) => {
//     // TODO: Unify networking library with main app
//     return fetch('/../v1/notifications/', {
//       headers: {
//         'Session-Token': sessionToken,
//         'User-Id': userId
//       }
//     });
//   }).then((response) => {
//     return response.text();
//   }).then((json) => {
//     const notifications = JSON.parse(json);
//     log('Fetched notifications: ', notifications);
//     return notifications;
//   }).catch(function(ex) {
//     console.log(ex);
//   });
// }
//
//
// function notShownOnThisClientBefore(notifications) {
//   return persistence.getPreviouslyShownNotifications().then((shownNotificationIds) => {
//     var result = [];
//     console.log('Database of previously shown notification IDs: ', shownNotificationIds);
//     for (var i = 0; i < notifications.length; i++) {
//       var note = notifications[i];
//       if (shownNotificationIds.indexOf(note.id) < 0) {
//         console.log('This client hasn\t shown notification '+note.id+' before');
//         result.push(note);
//       }
//     }
//     return result;
//   });
// }
//
// function showNotifications(notifications) {
//   return new Promise((resolve, reject) => {
//     persistence.getPreviouslyShownNotifications().then((shownNotificationIds) => {
//       let newShownNotificationIds = [];
//       for (var i = 0; i < notifications.length; i++) {
//         var note = notifications[i];
//         const noteToShow = {
//           title: note.title,
//           body: note.body,
//           url: note.url,
//           tag: note.id,
//           icon: note.icon
//         }
//         showNotification(note.title, note.body, note.url, note.icon, note.id);
//         // We only show notifications never shown before, so we will never add the same ID here twice
//         newShownNotificationIds.push(note.id);
//       }
//       persistence.markNotificationsAsShown(newShownNotificationIds);
//       // Resolve five second late just in case it took a while to show the notifications earlier
//       // TODO: Move the resolve to happen after at least one showNotification promise has resolved
//       setTimeout(resolve, 5000);
//     });
//   })
// }
