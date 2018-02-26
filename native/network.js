require('datejs');

const apiEndpoint = 'https://www.updogapp.co/api/v1'
// const apiEndpoint = 'http://192.168.86.207:8080/api/v1'
// const apiEndpoint = 'http://localhost:8080/api/v1'

const delayNetworkRequests = false

const warnUserOfError = () => {
  alert('Error - something went wrong. Are you offline? If not, please try again in a few minutes.')
}

const requestLogin = (fbToken) => {
  return sendRequest('login/', 'post', JSON.stringify({fbToken: fbToken}), undefined)
    .then((response) => {
      return {
        userId: response.userId,
        userName: response.userName,
        sessionToken: response.sessionToken,
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

const requestReportPlan = (user, plan) => {
  return sendRequest('plans/'+plan.id+'/report/', 'post', '', user)
}

const requestBlockUser = (user, userToBlockId) => {
  alert('blocked yo')
  return sendRequest('users/'+userToBlockId.id+'/block/', 'post', '', user)
}

const checkStatus = (response) => {
  if (response.status >= 200 && response.status < 300) {
    return response
  } else {
    console.error('Network request failed with status code ' + response.status, response)
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
    .then(() => {
      let req = {
        method,
        headers
      }
      if (body !== '') {
        req.body = body
      }
      return fetch(`${apiEndpoint}/${url}`, req)
    // .then(response => { console.log(response); return response })
    .then(checkStatus)
    .then(response => response.json())
    .catch((e) => {
      warnUserOfError()
      console.error(e)
    })
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
  requestReportPlan,
  requestBlockUser,
  requestCreatePushNotificationsSubscription,
  requestLogin
};
