var ListenerModule = function () {
  return (function () {
    var listeners = [];
    var change = function () {
      listeners.map(function (listener){
        listener();
      });
    };
    var addListener = function (listener) {
      listeners.push(listener);
    };
    return {
      addListener: addListener,
      change: change
    };
  })();
};

var models = (function () {
  var userId;
  var setUserId = function (newUserId) {
    userId = newUserId;
  };
  var getUserId = function () {
    return userId;
  };
  var setUserName = function (newUserName) {
    userName = newUserName;
  }
  var getUserName = function () {
    return userName;
  };
  var setSessionToken = function (sessionToken) {
    network.setSessionToken(sessionToken);
  };
  var startLogin = function (fbToken, success, failure) {
    network.login(fbToken, success, failure);
  };

  var activities = (function () {
    var activities = [];
    var listenerModule = ListenerModule();
    var addActivity = function (activity) {
      var validity = validateNewActivity(activity);
      if (!validity.isValid) {
        throw Error('Invalid activity attempted to be added: '+validity.reason);
      }
      activities.push(activity);
      // TODO(owen): insert at the right point to maintain date sort rather than this hack
      fixActivitiesOrder();
      listenerModule.change();
    };
    // Use this so we don't trigger two change events when we remove and readd
    var updateActivity = function (activity, activity_id) {
       activities = activities.filter(function(activity) {
        return (activity.activity_id !== activity_id);
      });
      addActivity(activity);
      listenerModule.change();   
    }
    var removeActivity = function (activity_id) {
      activities = activities.filter(function(activity) {
        return (activity.activity_id !== activity_id);
      });
      listenerModule.change();
    };
    var getActivity = function (activity_id) { 
      return activities.filter(function (activity) { return activity.activity_id == activity_id; } )[0];
    };
    var getActivities = function () {
      return activities;
    };
    var getActivitiesCount = function () {
      return activities.length;
    };
    var setActivities = function (newActivities) {
      activities = newActivities.filter(function(activity) {
        var validity = validateNewActivity(activity);
        if (!validity.isValid) {
          console.log('Not showing activity '+activity.activity_id+' from server because '+validity.reason);
        }
        return validity.isValid;
      });
      fixActivitiesOrder();
      listenerModule.change();
    };
    var tryCreateActivity = function (newActivity, success, failure) {
      var validity = validateNewActivity(newActivity);
      if (validity.isValid) {
        console.log(newActivity);
        network.requestCreateActivity(newActivity, success, failure);
      } else {
        console.log('activity wasn\'t valid because '+validity.reason);
        failure();
      }
    };
    var tryUpdateActivity = function (activity_id, activityChanges, success, failure) {
      network.requestUpdateActivity(activity_id, activityChanges, success, failure);
    };
    var trySetAttending = function (activity_id, attending, success, failure) {
      network.requestSetAttending(activity_id, attending, success, failure);
    };
    var setAttending = function (activity_id, attending) {
      throw('Should not be changing is_attending on client side');
      var activity = getActivity(activity_id);
      activity.is_attending = !activity.is_attending;
      listenerModule.change();
    };
    var tryCancelActivity = function (activity_id, success, failure) {
      network.requestCancelActivity(activity_id, success, failure);
    };
    // TODO: Make me much more efficient plz!
    var fixActivitiesOrder = function () {
      activities.sort(function(activityA, activityB) {
        a = new Date(activityA.start_time).getTime();
        b = new Date(activityB.start_time).getTime();
        if (a > b) {
          return -1;
        } else if (b > a) {
          return 1;
        } else {
          return (activityA.activity_id < activityB.activity_id) ? -1 : 1;
        }
      });
      activities.reverse();
    };
    var validateNewActivity = function (activity) {
      // TODO: Validate values of the properties
      // TODO: Validate client generated ones separately to server given ones
      var properties = ['max_attendees', 'description', 'start_time', 'title', 'location'];
      var hasProperties = properties.reduce(function(previous, property) { 
        return (previous && activity.hasOwnProperty(property)); 
      }, true);
      if (!hasProperties) {
        return {isValid: false, reason: 'some properties were missing'};
      }
      if (activity.title == '') {
        return {isValid: false, reason: 'missing title'};
      }
      if (!activity.start_time || !(activity.start_time instanceof Date)) {
        return {isValid: false, reason: 'date wasnt a date object or was missing'};
      }
      if (activity.start_time && activity.start_time instanceof Date) {
        // Allow users to see and edit events up to 2 hours in the past
        var now = (new Date).add(-2).hours();
        if (activity.start_time < now) {
          return {isValid: false, reason: 'date (' + activity.start_time.toString() + ') was in the past'};
        }
      }
      return {isValid: true};
    };
    var tryRefreshActivities = function (success, failure) {
      network.getActivitiesFromServer(success, failure);
    };
    // var hasActivitiesFromFriends = function () {
    //   var friendsActivities = activities.filter(function (activity) {
    //     return !activity.is_creator;
    //   });
    //   return (friendsActivities.length > 0);
    // };
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
  return {
    activities: activities,
    getUserId: getUserId,
    setUserId: setUserId,
    getUserName: getUserName,
    setUserName: setUserName,
    setSessionToken: setSessionToken,
    startLogin: startLogin
  }
})();