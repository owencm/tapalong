var network = (function() {
  var login = function (fb_token) {
    var req = new XMLHttpRequest();
    req.onload = function () {
      console.log(this.responseText);
    }
    req.open('post', '/../activities/login/', true);
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
      console.log(this.responseText);
      processActivitiesFromServer(this.responseText);
    }
    req.open('get', '/../activities/2/', true);
    req.setRequestHeader('SESSION_TOKEN', 'letmein');
    req.send();
  };
  var requestCreateActivity = function (activity, success, failure) {
    var req = new XMLHttpRequest();
    req.onload = function () {
      setTimeout(function() { success(); }, 500);
      // models.activities.addActivity(JSON.parse(this.responseText));
      // if(request succeeds) {
      //    success();
      // } else {
      //  failure();
      //}
    }
    req.open('post', '/../activities/2/', true);
    req.setRequestHeader('Session-Token', 'letmein');
    req.setRequestHeader('Content-type', 'application/json');
    req.send(JSON.stringify(activity));
  }
  var requestSetAttending = function (activity_id, attending, success, failure) {
    var req = new XMLHttpRequest();
    req.onload = function () {
      setTimeout(function() { models.activities.setAttending(activity_id, attending); success(); }, 500);
      // if(request succeeds) {
      //   models.activities.setAttending(activity_id, attending);
      //   success();
      // } else {
      //  failure();
      //}
    }
    req.open('post', '/../activities/2/'+activity_id, true);
    req.setRequestHeader('Session-Token', 'letmein');
    req.setRequestHeader('Content-type', 'application/json');
    req.send(JSON.stringify({attending: attending}));          
  }
  return {
    getActivitiesFromServer: getActivitiesFromServer,
    requestCreateActivity: requestCreateActivity,
    requestSetAttending: requestSetAttending,
    login: login
  };
})();