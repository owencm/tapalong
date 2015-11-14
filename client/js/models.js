require('datejs');
let network = require('./network.js');
let objectDB = require('./objectdb.js');
import m from './m.js';
import {addActivity, removeActivity} from './actions.js';

let store;
let setStore = (newStore) => {
  store = newStore;
}

let hasNotificationPermission = function (success, failure) {
  return hasPushPermission(success, failure);
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


module.exports = {
  hasNotificationPermission,
  setStore,
  tryCancelActivity,
}
