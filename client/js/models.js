require('datejs');
let ListenerModule = require('./listener.js');
let network = require('./network.js');
let objectDB = require('./objectdb.js');
import m from './m.js';

let startLogin = function (fbToken, success, failure) {
  // Pass in the user so the networking code explicitely knows the user is logged out
  network.requestLogin(user, fbToken, function (userId, userName, sessionToken) {
    user.setUserName(userName);
    user.setUserId(userId);
    user.setSessionToken(sessionToken);
    activities.tryRefreshActivities(success, function () {
      console.log('Failed to download activities')
    });
  }, failure);
};

let hasNotificationPermission = function (success, failure) {
  return hasPushPermission(success, failure);
};

let user = (function () {
  let loggedIn;
  let userId;
  let userName;
  let sessionToken;
  let listenerModule = ListenerModule();
  let isLoggedIn = function () {
    return loggedIn;
  }
  let setUserId = function (newUserId) {
    // TODO: Implement better login tracking
    loggedIn = true;
    userId = newUserId;
    let db = objectDB.open('db-1');
    db.put('userId', userId);
    listenerModule.change();
  };
  let getUserId = function () {
    return userId;
  };
  let setUserName = function (newUserName) {
    // TODO: Implement better login tracking
    loggedIn = true;
    userName = newUserName;
    let db = objectDB.open('db-1');
    db.put('userName', userName);
    listenerModule.change();
  }
  let getUserName = function () {
    return userName;
  };
  let setSessionToken = function (newSessionToken) {
    // TODO: Implement better login tracking
    loggedIn = true;
    sessionToken = newSessionToken;
    let db = objectDB.open('db-1');
    db.put('sessionToken', sessionToken);
    listenerModule.change();
  };
  let getSessionToken = function () {
    return sessionToken;
  };
  return {
    isLoggedIn: isLoggedIn,
    setUserId: setUserId,
    getUserId: getUserId,
    setUserName: setUserName,
    getUserName: getUserName,
    setSessionToken: setSessionToken,
    getSessionToken: getSessionToken,
    addListener: listenerModule.addListener
  };
})();

// TODO: Check that all the activities are still valid with an interval
let activities = (function () {
  let activities = [];
  let listenerModule = ListenerModule();
  let maxActivityId = 0;
  let addActivity = function (activity) {
    let validity = validateNewActivity(activity);
    if (!validity.isValid) {
      throw Error('Invalid activity attempted to be added: '+validity.reason);
    }
    activity.id = maxActivityId++;
    activities.push(activity);
    // TODO(owen): insert at the right point to maintain date sort rather than this hack
    fixActivitiesOrder();
    listenerModule.change();
  };
  // Use this so we don't trigger two change events when we remove and readd
  let updateActivity = function (id, newActivity) {
    let validity = validateNewActivity(newActivity);
    if (!validity.isValid) {
      throw Error('Invalid activity attempted to be updated: '+validity.reason);
    }
    if (newActivity.id !== id) {
      throw new Error('Tried to update an activity to a new activity whose id didn\'t match');
    }
    for (let i = 0; i < activities.length; i++) {
      if (activities[i].id == id) {
        // Instead of modifying the one activity, maybe just splice the array and replace it?
        activities[i] = newActivity;
      };
    }
    fixActivitiesOrder();
    listenerModule.change();
  }
  let removeActivity = function (id) {
    activities = activities.filter(function(activity) {
      return (activity.id !== id);
    });
    listenerModule.change();
  };
  let getActivity = function (id) {
    return activities.filter(function (activity) { return activity.id == id; } )[0];
  };
  let getActivities = function () {
    return activities;
  };
  let getActivitiesCount = function () {
    return activities.length;
  };
  let setActivities = function (newActivities) {
    activities = newActivities.filter(function(activity) {
      let validity = validateNewActivity(activity);
      if (!validity.isValid) {
        console.log('Not showing activity '+activity.activity_id+' from server because '+validity.reason);
      } else {
        activity.id = maxActivityId++;
      }
      return validity.isValid;
    });
    fixActivitiesOrder();
    listenerModule.change();
  };
  let tryCreateActivity = function (newActivity, success, failure) {
    console.log(newActivity);
    let validity = validateNewActivity(newActivity);
    if (validity.isValid) {
      console.log(newActivity);
      network.requestCreateActivity(user, newActivity, function (activityFromServer) {
        addActivity(activityFromServer);
        success();
      }, failure);
    } else {
      console.log('activity wasn\'t valid because '+validity.reason, newActivity);
      failure();
    }
  };
  let tryUpdateActivity = function (activity, activityChanges, success, failure) {
    network.requestUpdateActivity(user, activity, activityChanges, function (activityFromServer) {
      updateActivity(activity.id, activityFromServer);
      success();
    }, failure);
  };
  let trySetAttending = function (activity, attending, optimistic, success, failure) {
    network.requestSetAttending(user, activity, attending, optimistic, function (updatedActivity) {
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
  let tryCancelActivity = function (activity, success, failure) {
    network.requestCancelActivity(user, activity, function (activity) {
      // Note activity is the same as the other variable named activity,
      // just plumbed through as that's how we do it elsewhere
      removeActivity(activity.id);
      success();
    }, failure);
  };
  // TODO: Make me much more efficient plz!
  let fixActivitiesOrder = function () {
    activities.sort(function(activityA, activityB) {
      let a = new Date(activityA.start_time).getTime();
      let b = new Date(activityB.start_time).getTime();
      if (a > b) {
        return -1;
      } else if (b > a) {
        return 1;
      } else {
        return (activityA.id < activityB.id) ? -1 : 1;
      }
    });
    activities.reverse();
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
  let tryRefreshActivities = function (success, failure) {
    network.requestActivitiesFromServer(user, function (activities) {
      setActivities(activities);
      success();
    }, failure);
  };
  return {
    tryRefreshActivities: tryRefreshActivities,
    tryCreateActivity: tryCreateActivity,
    tryUpdateActivity: tryUpdateActivity,
    trySetAttending: trySetAttending,
    tryCancelActivity: tryCancelActivity,
    setAttending: setAttending,
    setActivities: setActivities,
    getActivities: getActivities,
    getActivitiesCount: getActivitiesCount,
    getActivity: getActivity,
    addActivity: addActivity,
    removeActivity: removeActivity,
    updateActivity: updateActivity,
    addListener: listenerModule.addListener,
    // hasActivitiesFromFriends: hasActivitiesFromFriends
  }
})();

module.exports = {
  activities: activities,
  user: user,
  startLogin: startLogin,
  hasNotificationPermission: hasNotificationPermission
}
