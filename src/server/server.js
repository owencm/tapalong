// import https from 'https';
import bodyParser from 'body-parser';
import compression from 'compression';
import express from 'express';
import path from 'path';
import { Users, Plans, Sessions } from './models.js';

const app = express();

// Setup gzip compression
app.use(compression());

// Setup static server
app.use(express.static(path.join(__dirname, 'public')));

// Set express to parse JSON in request bodies
app.use(bodyParser.json());

// Authenticate calls and add req.user
// TODO: find a tidier way of only authenticating specific endpoints
app.use('/api/v1', (req, res, next) => {
  if (req.path === '/login/') {
    next();
    return;
  }
  const id = req.headers['user-id'];
  const token = req.headers['session-token'];
  if (id === undefined || token === undefined) {
    return res.status(403);
  }
  Users.getUserWithIdAndSessionToken(id, token).then((user) => {
    if (user === null) {
      return res.status(403);
    }
    req.user = user;
    next();
  });
});

// Setup routes

// Index
app.get('/api/v1/plans/visible_to_user/', (req, res) => {
  Plans.getPlansVisibleToUser(req.user).then((plans) => {
    return plans.map((plan) => plan.serializedPlan);
  }).then((plans) => {
    res.send(JSON.stringify(plans));
  })
});

// Create new plan
app.post('/api/v1/plans/', (req, res) => {
  // TODO: authenticate the user
  const newSerializedPlan = req.body;
  Plans.createPlanForUser(newSerializedPlan, req.user).then((plan) => {
    res.send(JSON.stringify(plan.serializedPlan));
  });
});

// Update a plan
app.post('/api/v1/plans/:planId/', (req, res) => {
  const newSerializedPlan = req.body;
  const planId = req.params.planId;
  Plans.getPlanByIdForUser(planId, req.user).then((plan) => {
    if (!plan) {
      throw new Error('User could not edit that plan');
    }
    return Plans.updatePlanForUser(plan, newSerializedPlan, req.user);
  }).then((plan) => {
    res.send(JSON.stringify(plan.serializedPlan));
  });
});


// TODO: swap this toggling for an attend and unattend
app.post('/api/v1/plans/:planId/attend/', (req, res) => {
  const planId = req.params.planId;
  Plans.getPlanByIdForUser(planId, req.user).then((plan) => {
    if (!plan) {
      throw new Error('User could not edit that plan');
    }
    return Plans.toggleAttendingPlanForUser(plan, req.user);
  }).then((plan) => {
    res.send(JSON.stringify(plan.serializedPlan));
  });
});

// TODO: swap this toggling for an attend and unattend
app.post('/api/v1/plans/:planId/cancel/', (req, res) => {
  const planId = req.params.planId;
  // Get this plan, from the perspective of this user
  // Try to cancel the plan as this user
  res.send(plan);
});

// TODO: Implement Facebook login

app.post('/api/v1/login', (req, res) => {
  const fbToken = req.body.fb_token;
  Users.getOrCreateUserWithFBToken(fbToken).then(({ user, newlyCreated }) => {
    return Sessions.createSessionWithUser(user).then((sessionToken) => {
      // This is the response we're going to send back
      return {
        success: true,
        user_id: user.serializedUser.id,
        user_name: user.serializedUser.name,
        session_token: sessionToken,
        first_login: newlyCreated
      };
    });
  }).then((response) => res.send(JSON.stringify(response))).catch((e) => {
    setImmediate(() => { throw e });
  });
});

// Statically serve any remaining paths from the public folder
app.use('', express.static('public'));

// TODO: Implement a health check URL

// Setup ports and start listening

if (app.get('env') === 'development') {
  app.set('port', 8080);
};

if (app.get('env') === 'production') {
  app.set('port', 80);
};

app.listen(app.get('port'), () => {
  console.log('Listening on HTTP, port', app.get('port'));
});

// if (app.get('env') === 'production') {
//   const apphttps = https.createServer(
//     {
//       key: fs.readFileSync('/etc/letsencrypt/live/www.updogapp.co/privkey.pem'),
//       cert: fs.readFileSync('/etc/letsencrypt/live/www.updogapp.co/fullchain.pem')
//     },
//     app
//   );
//   apphttps.listen(443, () => {
//     console.log('Listening on HTTPS, port', 443);
//   });
// }
