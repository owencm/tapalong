// TODO: refactor so when adding we don't have to cast string to date here, but it is done in the model

var network = (function() {
  var sessionToken;
  var login = function (fb_token, success, failure) {
    console.log('Logging in to the app');
    var req = new XMLHttpRequest();
    req.onload = function () {
      if(req.status >= 200 && req.status < 400) {
        console.log(this.responseText);
        response = JSON.parse(this.responseText);
        if (response.success === "true") {
          success(response.user_id, response.user_name, response.session_token);
        } else {
          failure();
          throw('unexpected app login failure');
        }
      } else {
        // Request failed
        throw ('login request failed');
      }
    }
    req.open('post', '/../v1/login/', true);
    req.setRequestHeader('Content-type', 'application/json');
    req.send(JSON.stringify({fb_token: fb_token}));
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
    var req = new XMLHttpRequest();
    req.onload = function () {
      // TODO: Check this actually succeeded
      processActivitiesFromServer(this.responseText);
      success();
    }
    req.open('get', '/../v1/activities/visible_to_user/', true);
    req.setRequestHeader('USER_ID', models.getUserId());
    req.setRequestHeader('SESSION_TOKEN', sessionToken);
    req.send();
  };
  var requestCreateActivity = function (activity, success, failure) {
    var req = new XMLHttpRequest();
    req.onload = function () {
      if(req.status >= 200 && req.status < 400) {
        var activity = JSON.parse(this.responseText).activity;
        activity.start_time = new Date(activity.start_time);
        models.activities.addActivity(activity);
        success();
      } else {
        console.log("Error:");
        console.log(this.responseText)
        failure();
      }
    }
    req.open('post', '/../v1/activities/visible_to_user/', true);
    req.setRequestHeader('USER_ID', models.getUserId());
    req.setRequestHeader('SESSION_TOKEN', sessionToken);
    req.setRequestHeader('CONTENT_TYPE', 'application/json');
    req.send(JSON.stringify(activity));
  };
  var requestSetAttending = function (activity, attending, success, failure) {
    console.log(activity);
    var req = new XMLHttpRequest();
    req.onload = function () {
      if(req.status >= 200 && req.status < 400) {
        var updatedActivity = JSON.parse(this.responseText).activity;
        updatedActivity.start_time = new Date(updatedActivity.start_time);
        models.activities.updateActivity(updatedActivity.activity_id, updatedActivity);
        success();
      } else {
        failure();
      }
    };
    req.open('post', '/../v1/activities/'+activity.activity_id+'/attend/', true);
    req.setRequestHeader('SESSION_TOKEN', sessionToken);
    req.setRequestHeader('USER_ID', models.getUserId());
    req.setRequestHeader('CONTENT_TYPE', 'application/json');
    req.send(JSON.stringify({attending: attending}));          
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
    req.setRequestHeader('SESSION_TOKEN', sessionToken);
    req.setRequestHeader('USER_ID', models.getUserId());
    req.setRequestHeader('CONTENT_TYPE', 'application/json');
    req.send(body);
  }
  var setSessionToken = function (newSessionToken) {
    
    sessionToken = newSessionToken;
  }
  return {
    getActivitiesFromServer: getActivitiesFromServer,
    requestCreateActivity: requestCreateActivity,
    requestSetAttending: requestSetAttending,
    requestUpdateActivity: requestUpdateActivity,
    requestCancelActivity: requestCancelActivity,
    login: login,
    setSessionToken: setSessionToken
  };
})();