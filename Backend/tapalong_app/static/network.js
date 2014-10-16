var network = (function() {
  var sessionToken;
  var login = function (fb_token, success, failure) {
    var req = new XMLHttpRequest();
    req.onload = function () {
      if(req.status >= 200 && req.status < 400) {
        console.log(this.responseText);
        response = JSON.parse(this.responseText);
        if (response.success) {
          success(response.user_id, response.session_token);
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
    req.setRequestHeader('SESSION_TOKEN', 'letmein');
    req.send();
  };
  var requestCreateActivity = function (activity, success, failure) {
    var req = new XMLHttpRequest();
    req.onload = function () {
      if(req.status >= 200 && req.status < 400) {
        models.activities.addActivity(JSON.parse(this.responseText).activity);
        success();
      } else {
        failure();
      }
    }
    req.open('post', '/../v1/activities/visible_to_user/', true);
    req.setRequestHeader('USER_ID', models.getUserId());
    req.setRequestHeader('SESSION_TOKEN', 'letmein');
    req.setRequestHeader('CONTENT_TYPE', 'application/json');
    req.send(JSON.stringify(activity));
  };
  var requestSetAttending = function (activity_id, attending, success, failure) {
    var req = new XMLHttpRequest();
    req.onload = function () {
      if(req.status >= 200 && req.status < 400) {
        var updatedActivity = JSON.parse(this.responseText).activity;
        models.activities.removeActivity(updatedActivity.activity_id);
        models.activities.addActivity(updatedActivity);
        success();
      } else {
        failure();
      }
    };
    req.open('post', '/../v1/activities/'+activity_id+'/attend/', true);
    req.setRequestHeader('SESSION_TOKEN', 'letmein');
    req.setRequestHeader('USER_ID', models.getUserId());
    req.setRequestHeader('CONTENT_TYPE', 'application/json');
    req.send(JSON.stringify({attending: attending}));          
  };
  var requestUpdateActivity = function(activity_id, activityChanges, success, failure) {
    sendRequest('/../v1/activities/'+activity_id+'/', 'post', JSON.stringify(activityChanges), function () {
      if(req.status >= 200 && req.status < 400) {
        var updatedActivity = JSON.parse(this.responseText).activity;
        models.activities.removeActivity(updatedActivity.activity_id);
        models.activities.addActivity(updatedActivity);
        success();
      } else {
        failure();
      }
    });
  };
  var sendRequest = function (url, method, body, onload) {
    var req = new XMLHttpRequest();
    req.onload = onload;
    req.open(method, url, true);
    req.setRequestHeader('SESSION_TOKEN', sessionToken);
    req.setRequestHeader('USER_ID', models.userId);
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
    login: login,
    setSessionToken: setSessionToken
  };
})();