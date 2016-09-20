require('datejs');

const apiEndpoint = 'http://localhost:8080/api/v1';

const requestLogin = (fbToken) => {
  return sendRequest(apiEndpoint+'/login/', 'post', JSON.stringify({fb_token: fbToken}), undefined)
    .then((response) => {
      return {
        userId: response.user_id,
        userName: response.user_name,
        sessionToken: response.session_token
      }
    });
};

const requestActivitiesFromServer = (user, success, failure) => {
  const parseActivitiesFromJSON = (json) => {
    return json.map((activity) => {
      // Parse the datetimes into actual objects.
      activity.startTime = new Date(activity.startTime);
      return activity;
    });
  };

  return sendRequest(apiEndpoint+'/plans/visible_to_user/', 'get', '', user)
            .then(parseActivitiesFromJSON)
};

const requestCreateActivity = function (user, activity, success, failure) {
  return sendRequest(apiEndpoint+'/plans/', 'post', JSON.stringify(activity), user)
            .then((activity) => {
              activity.startTime = new Date(activity.startTime);
            })
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

const checkStatus = (response) => {
  if (response.status >= 200 && response.status < 300) {
    return response
  } else {
    var error = new Error(response.statusText)
    error.response = response
    throw error
  }
}

const sendRequest = function (url, method, body, user) {

  let headers = {
    'Content-Type': 'application/json',
  }

  if (user) {
    headers = Object.assign({}, headers, {
      'Session-Token': user.sessionToken,
      'User-Id': user.userId,
    })
  }

  return fetch(url, {
    method,
    body,
    headers
  }).then(checkStatus).then(response => response.json())

  // console.log('requesting', url)
  // let req = new XMLHttpRequest();
  // req.onload = onload;
  // // TODO: Fix me
  // req.open(method, url, true);
  // // The user isn't logged in when they are logging in
  // if (user) {
  //   req.setRequestHeader('Session-Token', user.sessionToken);
  //   req.setRequestHeader('User-Id', user.userId);
  // }
  // req.setRequestHeader('Content-Type', 'application/json');
  // req.send(body);
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
