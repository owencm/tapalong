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
  // Get the plans visible to this user
  res.send(JSON.stringify({}));
});

// Create new plan
app.post('/v1/plans/', (req, res) => {
  // TODO: authenticate the user
  // Create a new plan, save and return it
  res.send(JSON.stringify({}));
});

// Update a plan
app.post('/v1/plans/:planId/', (req, res) => {
  // Get this plan from the perspective of this user
  // Possibly parse the date
  // Update the plan as this user
  res.send(JSON.stringify({}));
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

// return {
//   "activity":
//     {
//       "activity_id": activity.id,
//       "is_creator": is_creator,
//       "creator_name": activity.creator.name,
//       "creator_id": activity.creator.id,
//       "title": activity.title,
//       "start_time": activity.start_time.isoformat(),
//       "description": activity.description,
//       "location": activity.location,
//       "max_attendees": activity.max_attendees,
//       "attendees": attendees_names,
//       "is_attending": is_attending,
//       "thumbnail": "https://graph.facebook.com/"+str(activity.creator.fb_id)+"/picture"
//      }
//    }

// TODO: Implement Facebook login

app.post('/v1/login', (req, res) => {
  // TODO: Move to fbToken everywhere
  const fbToken = req.body.fb_token;
  Users.getOrCreateUserWithFBToken(fbToken).then(({ user, newlyCreated }) => {
    return Sessions.createSessionWithUser(user).then((sessionToken) => {
      // This is the response we're going to send back
      return {
        success: true,
        user_id: user.id,
        user_name: user.name,
        session_token: sessionToken,
        first_login: newlyCreated
      };
    })
  }).then((response) => res.send(JSON.stringify(response))).catch((e) => {
    console.log(e);
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
