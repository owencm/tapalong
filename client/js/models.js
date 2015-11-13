require('datejs');
let network = require('./network.js');
let objectDB = require('./objectdb.js');
import m from './m.js';
import {addActivity, removeActivity} from './actions.js';

let store;
let setStore = (newStore) => {
  store = newStore;
}

let startLogin = function (fbToken, success, failure) {
  // Pass in the user so the networking code explicitely knows the user is logged out
  network.requestLogin(fbToken, function (userId, userName, sessionToken) {
    store.dispatch(setUser(userId, userName, sessionToken));
    activities.tryRefreshActivities(success, function () {
      console.log('Failed to download activities')
    });
  }, failure);
};

let hasNotificationPermission = function (success, failure) {
  return hasPushPermission(success, failure);
};

// TODO: Check that all the activities are still valid with an interval

let setActivities = function (newActivities) {
  // TODO: remove all previous activities
  newActivities.map((activity) => {
    store.dispatch(addActivity(activity));
  });
};

let tryCreateActivity = function (userId, sessionToken, newActivity, success, failure) {
  console.log(newActivity);
  let validity = validateNewActivity(newActivity);
  if (validity.isValid) {
    network.requestCreateActivity({userId, sessionToken}, newActivity, function (activityFromServer) {
      store.dispatch(addActivity(activityFromServer));
      success();
    }, failure);
  } else {
    console.log('activity wasn\'t valid because '+validity.reason, newActivity);
    failure();
  }
};

let tryUpdateActivity = function (userId, sessionToken, activity, activityChanges, success, failure) {
console.log(activity);
  network.requestUpdateActivity({userId, sessionToken}, activity, activityChanges, function (activityFromServer) {
    updateActivity(activity.id, activityFromServer);
    success();
  }, failure);
};

let trySetAttending = function (userId, sessionToken, activity, attending, optimistic, success, failure) {
  network.requestSetAttending({userId, sessionToken}, activity, attending, optimistic, function (updatedActivity) {
    updateActivity(activity.id, updatedActivity);
    success();
  }, failure);
};

let setAttending = function (id, attending) {
  throw('Should not be changing is_attending on client side');
  let activity = getActivity(id);
  activity.is_attending = !activity.is_attending;
  listenerModule.change();
};

let tryCancelActivity = function (userId, sessionToken, activity, success, failure) {
  network.requestCancelActivity({userId, sessionToken}, activity, function (activity) {
    // Note activity is the same as the other variable named activity,
    // just plumbed through as that's how we do it elsewhere
    store.dispatch(removeActivity(activity.id));
    success();
  }, failure);
};

let validateNewActivity = function (activity) {
  // TODO: Validate values of the properties
  // TODO: Validate client generated ones separately to server given ones
  let properties = ['max_attendees', 'description', 'start_time', 'title', 'location'];
  let hasProperties = properties.reduce(function(previous, property) {
    return (previous && activity.hasOwnProperty(property));
  }, true);
  if (!hasProperties) {
    return {isValid: false, reason: 'some properties were missing'};
  }
  if (activity.title == '') {
    return {isValid: false, reason: 'missing title'};
  }
  if (!activity.start_time || !(activity.start_time instanceof Date)) {
    return {isValid: false, reason: 'start_time wasnt a date object or was missing'};
  }
  if (activity.start_time && activity.start_time instanceof Date) {
    // Allow users to see and edit events up to 2 hours in the past
    let now = new Date;
    now = now.add(-2).hours();
    if (activity.start_time < now) {
      return {isValid: false, reason: 'date (' + activity.start_time.toString() + ') was in the past'};
    }
  }
  return {isValid: true};
};

let tryRefreshActivities = function (userId, sessionToken, success, failure) {
  network.requestActivitiesFromServer({userId, sessionToken}, function (activities) {
    setActivities(activities);
    success();
  }, failure);
};


module.exports = {
  startLogin,
  hasNotificationPermission,
  setStore,
  tryRefreshActivities,
  tryCreateActivity,
  tryUpdateActivity,
  trySetAttending,
  tryCancelActivity,
}
