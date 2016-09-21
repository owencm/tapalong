require('datejs');

const apiEndpoint = 'http://localhost:8080/api/v1'

const delayNetworkRequests = false

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

const fixDateOnActivity = (activity) => {
  activity.startTime = new Date(activity.startTime);
  return activity;
}

const requestActivitiesFromServer = (user) => {
  return sendRequest(apiEndpoint+'/plans/visible_to_user/', 'get', '', user)
    .then((activities) => {
      return activities.map(fixDateOnActivity)
    })
};

const requestCreateActivity = function (user, activity) {
  return sendRequest(apiEndpoint+'/plans/', 'post', JSON.stringify(activity), user)
    .then(fixDateOnActivity)
};

const requestSetAttending = function (user, activity, attending) {
  const endpointAction = attending ? 'attend' : 'unattend';
  return sendRequest(`${apiEndpoint}/plans/${activity.id}/${endpointAction}`, 'post', '', user)
    .then((updatedActivity) => {
      updatedActivity = fixDateOnActivity(updatedActivity)
      updatedActivity.clientId = activity.clientId
      return updatedActivity
    })
};

const requestUpdateActivity = function(user, activity, activityChanges) {
  return sendRequest(apiEndpoint+'/plans/'+activity.id+'/', 'post', JSON.stringify(activityChanges), user)
    .then((updatedActivity) => {
      updatedActivity = fixDateOnActivity(updatedActivity)
      updatedActivity.clientId = activity.clientId
      return updatedActivity
    })
};

const requestCancelActivity = function (user, activity) {
  return sendRequest(apiEndpoint+'/plans/'+activity.id+'/cancel/', 'post', '', user)
    .then(() => { return activity })
};

const requestCreatePushNotificationsSubscription = function (user, subscription) {
  return sendRequest(apiEndpoint+'/push_subscriptions/', 'post', JSON.stringify(subscription), user)
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

const wait = (ms) => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms)
  })
}

const sendRequest = (url, method, body, user) => {

  let headers = {
    'Content-Type': 'application/json',
  }

  if (user) {
    headers = Object.assign({}, headers, {
      'Session-Token': user.sessionToken,
      'User-Id': user.userId,
    })
  }

  return wait(delayNetworkRequests ? 500 + Math.random() * 1500 : 0)
    .then(() => { return fetch(url, {
      method,
      body,
      headers
    })
    .then(checkStatus)
    .then(response => response.json())
; return js })

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
