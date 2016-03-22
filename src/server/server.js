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

// TODO: authenticate the user
// token = request.META.get('HTTP_SESSION_TOKEN')
// user_id = request.META.get('HTTP_USER_ID')



// Setup routes

// Index
app.get('/v1/plans/visible_to_user/', (req, res) => {
  // TODO: authenticate the user
  Users.getUserWithId(1).then((user) => {
    Plans.getPlansVisibleToUser(user).then((plans) => {
      res.send(JSON.stringify(plans.map((plan) => plan.serializedPlan)));
    });
  })
});

// Create new plan
app.post('/v1/plans/', (req, res) => {
  // TODO: authenticate the user
  const newSerializedPlan = req.body;
  const user = { id: 1 };
  Users.getUserWithId(user.id).then((user) => {
    return Plans.createPlanForUser(newSerializedPlan, user).then((plan) => {
      res.send(JSON.stringify(plan.serializedPlan));
    });
  });
});

// Update a plan
app.post('/v1/plans/:planId/', (req, res) => {
  const user = { id: 1 };
  const newSerializedPlan = req.body;
  const planId = req.params.planId;
  Users.getUserWithId(user.id).then((user) => {
    Plans.getPlanByIdForUser(planId, user).then((plan) => {
      console.log(plan);
      if (!plan) {
        throw new Error('User could not edit that plan');
      }
      Plans.updatePlanForUser(plan, newSerializedPlan, user).then((plan) => {
        res.send(JSON.stringify(plan.serializedPlan));
      });
    });
  });
});


// TODO: swap this toggling for an attend and unattend
app.post('/v1/plans/:planId/attend/', (req, res) => {
  const planId = req.params.planId;
  // Get this plan, from the perspective of this user
  // If the user was attending, set to not attending
  // If this user wasn't attending
  //   Try to set them as attending (there may not be space)
  //   which should trigger a notification
  res.send(plan);
});

// TODO: swap this toggling for an attend and unattend
app.post('/v1/plans/:planId/cancel/', (req, res) => {
  const planId = req.params.planId;
  // Get this plan, from the perspective of this user
  // Try to cancel the plan as this user
  res.send(plan);
});

// TODO: Implement Facebook login

app.post('/v1/login', (req, res) => {
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
    })
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
