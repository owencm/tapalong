require('datejs');

const apiEndpoint = '/api/v1';

const requestLogin = function (fbToken) {
  return new Promise((resolve, reject) => {
    sendRequest(apiEndpoint+'/login/', 'post', JSON.stringify({fb_token: fbToken}), undefined, function() {
      if(this.status >= 200 && this.status < 400) {
        const response = JSON.parse(this.responseText);
        resolve({userId: response.user_id, userName: response.user_name, sessionToken: response.session_token});
      } else {
        reject();
        throw ('login request failed');
      }
    });
  })
};

const requestActivitiesFromServer = function (user, success, failure) {
  const parseActivitiesFromJSON = function (responseText) {
    // Strip activity label for each item
    const activities = JSON.parse(responseText).map(function (activity) {
      // Parse the datetimes into actual objects.
      activity.startTime = new Date(activity.startTime);
      activity.attendeeNames = activity.attendees.map(attendee => attendee.name)
      return activity;
    });
    return activities;
  };

  sendRequest(apiEndpoint+'/plans/visible_to_user/', 'get', '', user, function() {
    if (this.status >= 200 && this.status < 400) {
      // TODO: Check this actually succeeded
      const activities = parseActivitiesFromJSON(this.responseText);
      success(activities);
    } else {
      failure();
    }
  });
};

const requestCreateActivity = function (user, activity, success, failure) {
  sendRequest(apiEndpoint+'/plans/', 'post', JSON.stringify(activity), user, function() {
    if(this.status >= 200 && this.status < 400) {
      const activity = JSON.parse(this.responseText);
      activity.startTime = new Date(activity.startTime);
      success(activity);
    } else {
      console.log('Server error: ', this.responseText)
      failure();
    }
  });
};

const requestSetAttending = function (user, activity, attending, success, failure) {
  const endpointAction = attending ? 'attend' : 'unattend';
  sendRequest(`${apiEndpoint}/plans/${activity.id}/${endpointAction}`, 'post', '', user, function () {
    if(this.status >= 200 && this.status < 400) {
      let updatedActivity = JSON.parse(this.responseText);
      updatedActivity.startTime = new Date(updatedActivity.startTime);
      updatedActivity.clientId = activity.clientId;
      success(updatedActivity);
    } else {
      failure();
    }
  });
};

const requestUpdateActivity = function(user, activity, activityChanges, success, failure) {
  sendRequest(apiEndpoint+'/plans/'+activity.id+'/', 'post', JSON.stringify(activityChanges), user, function () {
    if(this.status >= 200 && this.status < 400) {
      let updatedActivity = JSON.parse(this.responseText);
      updatedActivity.startTime = new Date(updatedActivity.startTime);
      updatedActivity.clientId = activity.clientId;
      success(updatedActivity);
    } else {
      failure();
    }
  });
};

const requestCancelActivity = function (user, activity, success, failure) {
  sendRequest(apiEndpoint+'/plans/'+activity.id+'/cancel/', 'post', '', user, function () {
    if(this.status >= 200 && this.status < 400) {
      success(activity);
    } else {
      failure();
    }
  })
};

const requestCreatePushNotificationsSubscription = function (user, subscription) {
  sendRequest(apiEndpoint+'/push_subscriptions/', 'post', JSON.stringify(subscription), user, function () {});
};

const sendRequest = function (url, method, body, user, onload) {
  let req = new XMLHttpRequest();
  req.onload = onload;
  req.open(method, url, true);
  // The user isn't logged in when they are logging in
  if (user) {
    req.setRequestHeader('Session-Token', user.sessionToken);
    req.setRequestHeader('User-Id', user.userId);
  }
  req.setRequestHeader('Content-Type', 'application/json');
  req.send(body);
}

const sendToServiceWorker = function (data) {
  navigator.serviceWorker.controller.postMessage(data);
}

module.exports = {
  requestActivitiesFromServer,
  requestCreateActivity,
  requestSetAttending,
  requestUpdateActivity,
  requestCancelActivity,
  requestCreatePushNotificationsSubscription,
  requestLogin
};
