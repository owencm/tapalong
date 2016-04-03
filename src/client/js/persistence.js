import objectDB from './objectdb.js';

// TODO: maybe worry about race conditions when writing persistent data, for example
// if we receive multiple pushes simultaneously?

let db;
// Cache this to save on opening cost
let getDB = () => {
  if (db === undefined) {
    db = objectDB.open('db-1');
  }
  return db;
}

let setUser = (user) => {
  console.log('setting user to ', user);
  // Note objectDB isn't using actual promises so wrap it in a real one
  return new Promise((resolve, reject) => {
    getDB().put('user', user).then(resolve);
  });
}

let isLoggedIn = () => {
  return new Promise((resolve, reject) => {
    // Note objectDB isn't using actual promises so we can't chain the thens
    getDB().get('user').then((user) => {
      console.log('user', user);
      if (user !== undefined && user.userId !== undefined &&
          user.userName !== undefined && user.sessionToken !== undefined) {
        resolve(user);
      } else {
        reject();
      }
    });
  });
}

let markNotificationsAsShown = (newShownNotificationIds) => {
  getDB().get('notificationIds').then((notificationIds) => {
    getDB().put('notificationIds', notificationIds.concat(newShownNotificationIds));
  })
}

let getPreviouslyShownNotifications = () => {
  // Note objectDB does not use real promises, so wrap in a real one
  return new Promise((resolve, reject) => {
    getDB().get('notificationIds').then((notificationIds) => {
      resolve(notificationIds);
    })
  });
}

getDB().get().then((data) => {
  if (data === undefined || data.notificationIds === undefined) {
    getDB().put('notificationIds', []);
  }
})

module.exports = {
  setUser,
  isLoggedIn,
  markNotificationsAsShown,
  getPreviouslyShownNotifications
};
