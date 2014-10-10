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
  // TODO(owen): Sort out current user id
  var local_user_id = 2;
  var activities = (function () {
    var activities = [];
    var listenerModule = ListenerModule();
    var addActivity = function (activity) {
      if (!validate(activity)) {
        throw Error('Invalid activity attempted to be added');
      }
      activities.push(activity);
      // TODO(owen): insert at the right point to maintain date sort
      listenerModule.change();
    };
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
    var setActivities = function (newActivities) {
      activities = newActivities;
      listenerModule.change();
    };
    var tryCreateActivity = function (newActivity, success, failure) {
      var validity = validate(newActivity);
      if (validity.isValid) {
        network.requestCreateActivity(newActivity, success, failure);
      } else {
        failure();
      }
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
    var validate = function (activity) {
      // TODO: Validate values of the properties
      // TODO: Validate client generated ones separately to server given ones
      var properties = ['max_attendees', 'description', 'start_time', 'title', 'location'];
      var hasProperties = properties.reduce(function(previous, property) { 
        return (previous && activity.hasOwnProperty(property)); 
      }, true);
      return {isValid: hasProperties};
    };
    return {
      tryCreateActivity: tryCreateActivity,
      trySetAttending: trySetAttending,
      setAttending: setAttending,
      setActivities: setActivities,
      getActivities: getActivities,
      getActivity: getActivity,
      addActivity: addActivity,
      removeActivity: removeActivity,
      addListener: listenerModule.addListener,
    }
  })();
  return {
    activities: activities,
    local_user_id: local_user_id
  }
})();