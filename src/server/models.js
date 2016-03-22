import FB from 'fb';
import jwt from 'jsonwebtoken';
import Sequelize from 'sequelize';

const sequelize = new Sequelize('tapalong_db_1', 'root', 'password', {
  logging: false
});

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

SQPlan.belongsToMany(SQUser, { as: 'Attendees', through: SQUserPlan, foreignKey: 'planId' });
SQUser.belongsToMany(SQPlan, { as: 'PlansToAttend', through: SQUserPlan, foreignKey: 'userId' });
SQPlan.belongsTo(SQUser, { as: 'Creator' });

// sequelize.query('SET FOREIGN_KEY_CHECKS = 0').then(() => {
//   return SQPlan.sync({ force: true });
// }).then(() => {
//   return SQUser.sync({ force: true });
// }).then(() => {
//   return SQUserPlan.sync({ force: true });
// }).then(() => {
//   sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
// });

// TODO: move to a library of helpers

const promiseAllObj = (obj) => {
  let promiseArr = [];
  for (let key in obj) {
    promiseArr.push(obj[key].then((result) => {
      return { [key]: result };
    }));
  };
  return Promise.all(promiseArr).then((arrOfObjs) => {
    return arrOfObjs.reduce((a, b) => Object.assign(a, b));
  });
}

const Users = (() => {
  const createUser = (fbId, name, friends) => {
    return SQUser.create({ fbId, name, friends }).then(getUserFromDBUser);
  };

  const getUserFromDBUser = (dbUser) => {
    // TODO: move to rest syntax
    // TODO: whitelist values passed through for safety
    let serializedUser = dbUser.get({ plain: true });
    serializedUser.image = `http://graph.facebook.com/${serializedUser.fbId}/picture`;
    serializedUser.bigImage = serializedUser.image + '?type=large';
    return { dbUser, serializedUser };
  };

  const getUserWithFBId = (fbId) => {
    return SQUser.findOne({ where: { fbId } }).then((dbUser) => {
      if (!dbUser) {
        return null;
      }
      return getUserFromDBUser(dbUser);
    });
  };

  const getUserWithId = (id) => {
    return SQUser.findOne({ where: { id } }).then((dbUser) => {
      if (!dbUser) {
        return null;
      }
      return getUserFromDBUser(dbUser);
    });
  }

  const getUserWithIdAndSessionToken = (id, token) => {
    return SQUser.findOne({ where: { id } }).then((dbUser) => {
      if (!dbUser) {
        return null;
      }
      const user = getUserFromDBUser(dbUser);
      return Sessions.verifySessionForUser(token, user).then((tokenValidForUser) => {
        return tokenValidForUser ? user : null;
      });
    });
  }

  const getOrCreateUserWithFBToken = (FBToken) => {
    FB.setAccessToken(FBToken);
    return new Promise((resolve, reject) => {
      FB.api('/me', (res) => {
        if(!res || res.error) {
         reject(!res ? 'FB API error occurred' : res.error);
        }
        // TODO: grab friends and pass them through
        resolve({fbId: res.id, name: res.name, friends: ''});
      });
    }).then((fbUser) => {
      // Get the user from the database if they exist
      // Don't use normal chaining style since we may need access to fbUser
      let userPromise = getUserWithFBId(fbUser.fbId);
      return userPromise.then((user) => {
        if (!user) {
          return createUser(fbUser.fbId, fbUser.name, fbUser.friends).then((user) => {
            return { user, newlyCreated: true }
          });
        }
        // The user exists, so return them
        return {
          user,
          newlyCreated: false
        };
      });
    });
  }

  return {
    createUser,
    getOrCreateUserWithFBToken,
    getUserWithId,
    getUserWithIdAndSessionToken,
    getUserFromDBUser
  }
})();

const Plans = (() => {
  const getPlanFromDBPlanForUser = (dbPlan, user) => {

    const creator = dbPlan.getCreator();

    const serializedCreator = creator.then((dbUser) => {
      return Users.getUserFromDBUser(dbUser);
    }).then((user) => user.serializedUser);

    const attendeeNames = dbPlan.getAttendees().then((dbAttendees) => {
      // TODO: filter so this doesn't include user
      return dbAttendees.map((dbUser) => dbUser.get('name'));
    });

    const thumbnail = serializedCreator.then((serializedCreator) => serializedCreator.image);
    const creatorName = serializedCreator.then((serializedCreator) => serializedCreator.name);
    const isCreator = creator.then((dbUser) => dbUser.get('id') === user.dbUser.get('id'));

    const attrPromises = { attendeeNames, thumbnail, creatorName, isCreator };

    return promiseAllObj(attrPromises).then((attrs) => {
      return {
        dbPlan,
        serializedPlan: Object.assign(
          dbPlan.get({ plain: true }),
          attrs
        )
      };
    });
  }

  const getPlansVisibleToUser = (user) => {
    // TODO: limit to only plans by their friends
    return SQPlan.findAll().then((dbPlans) => {
      return Promise.all(dbPlans.map((dbPlan) => getPlanFromDBPlanForUser(dbPlan, user)));
    });
  };

  const createPlanForUser = (plan, user) => {
    return SQPlan.create(plan).then((dbPlan) => {
      return dbPlan.setCreator(user.dbUser).then(() => {
        return getPlanFromDBPlanForUser(dbPlan, user);
      });
    });
  };

  const getPlanByIdForUser = (id, user) => {
    // TODO: ensure this user is either the creator, or friends with the creator
    return SQPlan.find({ where: { id: id } }).then((dbPlan) => {
      return getPlanFromDBPlanForUser(dbPlan, user);
    });
  };

  const toggleAttendingPlanForUser = (plan, user) => {
    // TODO: ensure they're the able to see the plan
    return plan.dbPlan.getAttendees().then((dbUsers) => {
      const isAttending = (dbUsers.filter((dbUser) => dbUser.get('id') === user.dbUser.get('id')));
      return (isAttending) ? plan.dbPlan.removeAttendee(user.dbUser) :
                             plan.dbPlan.addAttendee(user.dbUser);
      }).then((dbPlan) => {
      return getPlanFromDBPlanForUser(dbPlan, user);
    });
  };

  const updatePlanForUser = (plan, newSerializedPlan, user) => {
    return plan.dbPlan.getCreator().then((dbUser) => {
      if (dbUser.get('id') !== user.dbUser.get('id')) {
        throw new Error('This user cant edit that plan');
      }
    }).then(() => {
      return plan.dbPlan.update(newSerializedPlan);
    }).then((dbPlan) => {
      return getPlanFromDBPlanForUser(dbPlan, user);
    });
  };

  return {
    getPlansVisibleToUser,
    getPlanByIdForUser,
    createPlanForUser,
    updatePlanForUser,
    toggleAttendingPlanForUser
  };
})();

const Sessions = (() => {
  // TODO: move this to somewhere secure
  const sessionSecret = 'ymkYmbXLH8Vg2NRRERpLLIYKVHG3kwXiIw828CClvphIAHdLo3SFgiUpJOW0';

  // TODO: add versioning in case we want to change payload style
  const createSessionWithUser = (user) => {
    const token = jwt.sign({ userId: user.serializedUser.id }, sessionSecret, { expiresIn: '90d' });
    return Promise.resolve(token);
  };

  const verifySessionForUser = (token, user) => {
    return new Promise((resolve, reject) => {
      jwt.verify(token, sessionSecret, (err, decoded) => {
        if (err || decoded.userId !== user.serializedUser.id) {
          resolve(false)
        }
        resolve(true);
      });
    });
  };

  return { createSessionWithUser, verifySessionForUser };
})();

// TODO: set up notifications

module.exports = { Users, Sessions, Plans }
