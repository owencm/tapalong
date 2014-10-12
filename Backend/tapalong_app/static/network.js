var network = (function() {
  var login = function (fb_token) {
    var req = new XMLHttpRequest();
    req.onload = function () {
      console.log(this.responseText);
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
  var getActivitiesFromServer = function () {
    var req = new XMLHttpRequest();
    req.onload = function () {
      processActivitiesFromServer(this.responseText);
    }
    req.open('get', '/../v1/activities/visible_to_user/'+models.local_user_id+'/', true);
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
    req.open('post', '/../v1/activities/visible_to_user/'+models.local_user_id+'/', true);
    req.setRequestHeader('Session-Token', 'letmein');
    req.setRequestHeader('Content-type', 'application/json');
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
    req.open('post', '/../v1/activities/'+activity_id+'/attend/'+models.local_user_id+'/', true);
    req.setRequestHeader('Session-Token', 'letmein');
    req.setRequestHeader('Content-type', 'application/json');
    req.send(JSON.stringify({attending: attending}));          
  };
  var requestUpdateActivity = function(activity_id, activityChanges, success, failure) {
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
    req.open('post', '/../v1/activities/'+activity_id+'/'+models.local_user_id+'/', true);
    req.setRequestHeader('Session-Token', 'letmein');
    req.setRequestHeader('Content-type', 'application/json');
    req.send(JSON.stringify(activityChanges)); 
  };
  return {
    getActivitiesFromServer: getActivitiesFromServer,
    requestCreateActivity: requestCreateActivity,
    requestSetAttending: requestSetAttending,
    requestUpdateActivity: requestUpdateActivity,
    login: login
  };
})();