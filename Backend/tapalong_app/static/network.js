// TODO: refactor so when adding we don't have to cast string to date here, but it is done in the model

var network = (function() {
  var login = function (fb_token, success, failure) {
    console.log('Logging in to the app');
    sendRequest('/../v1/login/', 'post', JSON.stringify({fb_token: fb_token}), function() {
      if(this.status >= 200 && this.status < 400) {
        console.log(this.responseText);
        response = JSON.parse(this.responseText);
        if (response.success === 'true') {
          success(response.user_id, response.user_name, response.session_token);
        } else {
          failure();
          throw('unexpected app login failure');
        }
      } else {
        // Request failed
        throw ('login request failed');
      }
    });
  }
  var processActivitiesFromServer = function (responseText) {
    // Strip activity label for each item
    var activities = JSON.parse(responseText).map(function (activity) {
        return activity.activity;
    });
    // Convert every date from a string into a date object
    activities.forEach(function (activity) {
      // alert(activity.start_time);
      activity.start_time = new Date(activity.start_time);
    });
    models.activities.setActivities(activities);
  };
  var getActivitiesFromServer = function (success, failure) {
    sendRequest('/../v1/activities/visible_to_user/', 'get', '', function() {
      if (this.status >= 200 && this.status < 400) {
        // TODO: Check this actually succeeded
        processActivitiesFromServer(this.responseText);
        success();
      } else {
        failure();
      }
    });
  };
  var requestCreateActivity = function (activity, success, failure) {
    sendRequest('/../v1/activities/visible_to_user/', 'post', JSON.stringify(activity), function() {
      if(this.status >= 200 && this.status < 400) {
        var activity = JSON.parse(this.responseText).activity;
        activity.start_time = new Date(activity.start_time);
        models.activities.addActivity(activity);
        success();
      } else {
        console.log('Server error: ', this.responseText)
        failure();
      }
    });
  };
  var requestSetAttending = function (activity, attending, success, failure) {
    sendRequest('/../v1/activities/'+activity.activity_id+'/attend/', 'post', JSON.stringify({attending: attending}), function () {
      if(this.status >= 200 && this.status < 400) {
        var updatedActivity = JSON.parse(this.responseText).activity;
        console.log('Network provided the following start time: ',updatedActivity.start_time);
        updatedActivity.start_time = new Date(updatedActivity.start_time);
        console.log('Which we parsed into: ',updatedActivity.start_time);
        models.activities.updateActivity(updatedActivity.activity_id, updatedActivity);
        success();
      } else {
        failure();
      }
    });
  };
  var requestUpdateActivity = function(activity, activityChanges, success, failure) {
    sendRequest('/../v1/activities/'+activity.activity_id+'/', 'post', JSON.stringify(activityChanges), function () {
      if(this.status >= 200 && this.status < 400) {
        var updatedActivity = JSON.parse(this.responseText).activity;
        updatedActivity.start_time = new Date(updatedActivity.start_time);
        models.activities.updateActivity(updatedActivity.activity_id, updatedActivity);
        success();
      } else {
        failure();
      }
    });
  };
  var requestCancelActivity = function (activity, success, failure) {
    sendRequest('/../v1/activities/'+activity.activity_id+'/cancel/', 'post', '', function () {
      if(this.status >= 200 && this.status < 400) {
        models.activities.removeActivity(activity.activity_id);
        success();
      } else {
        failure();
      }
    })
  }
  var sendRequest = function (url, method, body, onload) {
    var req = new XMLHttpRequest();
    req.onload = onload;
    req.open(method, url, true);
    // Only set session_token and user_id if the user is logged in. 
    // TODO: Use state in the model to know whether the user is logged in.
    var sessionToken = models.user.getSessionToken();
    var userId = models.user.getUserId();
    if (sessionToken !== undefined && userId !== undefined) {
      req.setRequestHeader('SESSION_TOKEN', sessionToken);
      req.setRequestHeader('USER_ID', userId);
    } else {
      console.log('Sending an unauthenticated request since we haven\'t logged in yet');
    }
    req.setRequestHeader('CONTENT_TYPE', 'application/json');
    req.send(body);
  }
  var sendToServiceWorker = function (data) {
    navigator.serviceWorker.controller.postMessage(data);
  }
  return {
    getActivitiesFromServer: getActivitiesFromServer,
    requestCreateActivity: requestCreateActivity,
    requestSetAttending: requestSetAttending,
    requestUpdateActivity: requestUpdateActivity,
    requestCancelActivity: requestCancelActivity,
    login: login
  };
})();