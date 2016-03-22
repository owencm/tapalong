import FB from 'fb';
import Sequelize from 'sequelize';

const sequelize = new Sequelize('tapalong_db_1', 'root', 'password');

// TODO: set up sessions

const SQPlan = sequelize.define('plan', {
  description: Sequelize.STRING,
  startTime: Sequelize.DATE,
  title: Sequelize.STRING,
});

// TODO: ensure INTEGER is big enough for fb_id
const SQUser = sequelize.define('user', {
  name: Sequelize.STRING,
  fbId: Sequelize.INTEGER,
  friends: Sequelize.STRING
});

const SQUserPlan = sequelize.define('user_plan', {});

SQPlan.belongsToMany(SQUser, { as: 'PlansAttending', through: SQUserPlan });
SQUser.belongsToMany(SQPlan, { as: 'Attendees', through: SQUserPlan });
SQUser.hasMany(SQPlan, { as: 'Creator' });

sequelize.query('SET FOREIGN_KEY_CHECKS = 0').then(() => {
  return SQPlan.sync({ force: true });
}).then(() => {
  return SQUser.sync({ force: true });
}).then(() => {
  return SQUserPlan.sync({ force: true });
}).then(() => {
  sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
});

const Users = (() => {
  const createUser = (fbId, name, friends) => {
    return SQUser.create({ fbId, name, friends }).then(getUserFromDBUser);
  };

  const getUserFromDBUser = (dbUser) => {
    // TODO: move to rest syntax
    let user = dbUser.get({plain: true});
    user.image = `http://graph.facebook.com/${user.fbId}/picture`;
    user.bigImage = user.image + '?type=large';
    return user;
  };

  const getUserWithFBId = (fbId) => {
    return SQUser.findOne({ where: { fbId } }).then((dbUser) => {
      if (!dbUser) {
        return null;
      }
      return getUserFromDBUser(dbUser);
    });
  };

  const getOrCreateUserWithFBToken = (FBToken) => {
    FB.setAccessToken(FBToken);
    return new Promise((resolve, reject) => {
      FB.api('/me', (res) => {
        if(!res || res.error) {
         reject(!res ? 'FB API error occurred' : res.error);
        }
        // TODO: grab friends and pass them through
        resolve({fbId: res.id, name: res.name, friends: []});
      });
    }).then((fbUser) => {
      // Get the user from the database if they exist
      // Don't use normal chaining style since we may need access to fbUser
      let userPromise = getUserWithFBId(fbUser.fbId);
      return userPromise.then((user) => {
        if (!user) {
          return createUser(fbUser.fbId, fbUser.name, fbUser.friend).then((user) => {
            return { user, newlyCreated: true }
          });
        }
        // The user exists, so return them
        return { user, newlyCreated: false };
      });
    });
  }

  return { createUser, getOrCreateUserWithFBToken }
})();

const Plans = (() => {

})();

const Sessions = (() => {
  const createSessionWithUser = (user) => {
    // TODO: Implement
    return Promise.resolve(0);
  };

  return { createSessionWithUser };
})();

// TODO: set up notifications

module.exports = { Users, Sessions, Plans }
