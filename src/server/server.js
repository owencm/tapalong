// TODO: have the user login with Facebook again every now and again to prevent
//   their token from expiring

import fs from 'fs';
import https from 'https';
import bodyParser from 'body-parser';
import compression from 'compression';
import express from 'express';
import path from 'path';
import { Users, Plans, Sessions, PushSubs } from './models.js';

const app = express();

// Setup gzip compression
app.use(compression());

// Set express to parse JSON in request bodies
app.use(bodyParser.json());

// Authenticate calls and add req.user
// TODO: find a tidier way of only authenticating specific endpoints
// TODO: Find a tidier way of sending 403s
app.use('/api/v1', (req, res, next) => {
  if (req.path === '/login/') {
    next();
    return;
  }
  const id = req.headers['user-id'];
  const token = req.headers['session-token'];
  if (id === undefined || token === undefined) {
    res.status(403);
    res.end();
    return
  }
  Users.getUserWithIdAndSessionToken(id, token).then((user) => {
    if (user === null) {
      res.status(403);
      res.end();
      return
    }
    req.user = user;
    next();
  });
});

const promiseWithTimeout = (promise, timeout) => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, timeout);
    return promise.then(resolve);
  });
}

// Find Owen so we can send him push when stuff happens later
let owen;
Users.getUserWithFbId('680160262').then((user) => {
  owen = user;
});

// Setup routes

app.post('/api/v1/login', (req, res) => {
  const fbToken = req.body.fb_token;
  // TODO: Handle accessing user data on FB failing
  Users.getOrCreateUserWithFbToken(fbToken).then(({ user, newlyCreated }) => {
    if (newlyCreated) {
      const title = `${user.serializedUser.name} joined Up Dog`;
      const body = ' ';
      const url = '/';
      const tag = 'server-start';
      PushSubs.sendNotificationToUser({ title, body, url, tag }, owen);
    }
    return Sessions.createSessionWithUser(user).then((token) => {
      // This is the response we're going to send back
      // TODO: Move away from underscore style
      return {
        success: true,
        user_id: user.serializedUser.id,
        user_name: user.serializedUser.name,
        session_token: token,
        first_login: newlyCreated
      };
    });
  }).then((response) => res.send(JSON.stringify(response))).catch((e) => {
    setImmediate(() => { throw e });
  });
});

// TODO: Only return plans in the future
// Index
app.get('/api/v1/plans/visible_to_user/', (req, res) => {
  // Update the list of this users FB friends in case one of their friends has joined
  promiseWithTimeout(Users.refreshFbFriendsForUser(req.user), 100).then(() => {
    return Plans.getPlansVisibleToUser(req.user);
  }).then((plans) => {
    return plans.map((plan) => plan.serializedPlan);
  }).then((plans) => {
    res.send(JSON.stringify(plans));
  });
});

// Create new plan
app.post('/api/v1/plans/', (req, res) => {
  const newSerializedPlan = req.body;
  Plans.createPlanForUser(newSerializedPlan, req.user).then((plan) => {
    res.send(JSON.stringify(plan.serializedPlan));
  });
});

// Update a plan
app.post('/api/v1/plans/:planId/', (req, res) => {
  const newSerializedPlan = req.body;
  const planId = req.params.planId;
  return Plans.updatePlanByIdForUser(planId, newSerializedPlan, req.user).then((plan) => {
    res.send(JSON.stringify(plan.serializedPlan));
  });
});

app.post('/api/v1/plans/:planId/attend/', (req, res) => {
  const planId = req.params.planId;
  return Plans.setUserAttendingPlanId(planId, req.user, true).then((plan) => {
    res.send(JSON.stringify(plan.serializedPlan));
    PushSubs.sendNotificationToUser({
      title: `Up Dog: ${plan.serializedPlan.title}`,
      body: `${req.user.serializedUser.name} is coming along`,
      url: '/',
      tag: 'static'
    }, plan.creator);
  });
});

app.post('/api/v1/plans/:planId/unattend/', (req, res) => {
  const planId = req.params.planId;
  return Plans.setUserAttendingPlanId(planId, req.user, false).then((plan) => {
    res.send(JSON.stringify(plan.serializedPlan));
  });
});

app.post('/api/v1/plans/:planId/cancel/', (req, res) => {
  const planId = req.params.planId;
  return Plans.cancelPlanByIdForUser(planId, req.user).then((plan) => {
    res.send(plan);
  });
});

app.post('/api/v1/push_subscriptions', (req, res) => {
  const endpoint = req.body.endpoint;
  const keys = req.body.encodedKeys;
  const userPublicKey = keys.p256dh;
  const userAuthKey = keys.auth;
  console.log('got keys',userPublicKey, userAuthKey);
  PushSubs.createPushSubForUser(endpoint, userPublicKey, userAuthKey, req.user).then(() => {
    res.sendStatus(200);
  });
});

// TODO: Implement a health check URL

// Statically serve any remaining paths from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Setup ports and start listening

if (app.get('env') === 'development') {
  app.set('port', 8080);
  app.listen(app.get('port'), () => {
    console.log('Listening on HTTP, port', app.get('port'));
  });
}

if (app.get('env') === 'production') {
  const apphttps = https.createServer(
    {
      key: fs.readFileSync('/etc/letsencrypt/live/www.updogapp.co/privkey.pem'),
      cert: fs.readFileSync('/etc/letsencrypt/live/www.updogapp.co/fullchain.pem')
    },
    app
  );
  apphttps.listen(443, () => {
    console.log('Listening on HTTPS, port', 443);
  });
  var httpRedirectionApp = express();
  // set up a route to redirect http to https
  httpRedirectionApp.get('*', (req,res) => {
      res.redirect('https://' + req.headers.host + req.url);
  })
  httpRedirectionApp.listen(80, () => {
    console.log('Listening on HTTP to redirect, port', 80);
  });
}
