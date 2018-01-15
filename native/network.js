require('datejs');

const apiEndpoint = 'http://192.168.86.207:8080/api/v1'
// const apiEndpoint = 'http://localhost:8080/api/v1'

const delayNetworkRequests = true

const requestLogin = (fbToken) => {
  return sendRequest('login/', 'post', JSON.stringify({fb_token: fbToken}), undefined)
    .then((response) => {
      return {
        userId: response.user_id,
        userName: response.user_name,
        sessionToken: response.session_token,
        thumbnail: response.image,
      }
    }).catch((e) => { throw e })
};

const fixDateOnPlan = (plan) => {
  plan.startTime = new Date(plan.startTime);
  return plan;
}

const requestEventsFromServer = (user) => {
  return sendRequest('public_events/', 'get', '', user)
}

const requestPlansFromServer = (user) => {
  return sendRequest('plans/visible_to_user/', 'get', '', user)
    .then((plans) => {
      return plans.map(fixDateOnPlan)
    })
};

const requestCreatePlan = function (user, plan) {
  return sendRequest('plans/', 'post', JSON.stringify(plan), user)
    .then(fixDateOnPlan)
};

const requestSetAttending = function (user, plan, attending) {
  const endpointAction = attending ? 'attend' : 'unattend';
  return sendRequest(`plans/${plan.id}/${endpointAction}`, 'post', '', user)
    .then((updatedPlan) => {
      updatedPlan = fixDateOnPlan(updatedPlan)
      updatedPlan.clientId = plan.clientId
      return updatedPlan
    })
};

const requestUpdatePlan = function(user, plan, planChanges) {
  return sendRequest('plans/'+plan.id+'', 'post', JSON.stringify(planChanges), user)
    .then((updatedPlan) => {
      updatedPlan = fixDateOnPlan(updatedPlan)
      updatedPlan.clientId = plan.clientId
      return updatedPlan
    })
};

const requestCancelPlan = function (user, plan) {
  return sendRequest('plans/'+plan.id+'/cancel/', 'post', '', user)
    .then(() => { return plan })
};

const requestCreatePushNotificationsSubscription = function (user, subscription) {
  const expoSubscription = {
    type: 'expo',
    token: subscription,
  }
  return sendRequest('push_subscriptions/', 'post', JSON.stringify(expoSubscription), user)
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

  console.log(url, method, body, user)

  let headers = {
    'Content-Type': 'application/json',
  }

  if (user) {
    headers = Object.assign({}, headers, {
      'Session-Token': user.sessionToken,
      'User-Id': user.userId,
    })
  }

  return wait(delayNetworkRequests ? 1000 + Math.random() * 2000 : 0)
    .then(() => { return fetch(`${apiEndpoint}/${url}`, {
      method,
      body,
      headers
    })
    .then(checkStatus)
    .then(response => response.json())
    .catch((e) => {
      //TODO: ignore the error whereby the response has no JSON body becuase it's just an OK
      console.error(e)
    })
    // .then(json => { if (url === 'push_subscriptions/') { console.log(json); } return json })
  })

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

export default {
  requestPlansFromServer,
  requestEventsFromServer,
  requestCreatePlan,
  requestSetAttending,
  requestUpdatePlan,
  requestCancelPlan,
  requestCreatePushNotificationsSubscription,
  requestLogin
};
