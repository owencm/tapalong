// TODO: This code is all very inefficient with DB queries. Optimize me plz

import FB from 'fb';
import jwt from 'jsonwebtoken';
import Sequelize from 'sequelize';
import webPush from 'web-push';

// TODO: Move this to some configuration system and use different settings in prod
const sequelize = new Sequelize('tapalong_db_1', 'root', 'password', {
  // logging: console.log
  logging: undefined
});

const SQPlan = sequelize.define('plan', {
  description: Sequelize.STRING,
  startTime: Sequelize.DATE,
  title: Sequelize.STRING,
});

const SQUser = sequelize.define('user', {
  name: Sequelize.STRING,
  fbId: Sequelize.BIGINT,
  friends: Sequelize.STRING
});

const SQUserPlan = sequelize.define('user_plan', {});

SQPlan.belongsToMany(SQUser, { as: 'Attendees', through: SQUserPlan, foreignKey: 'planId' });
SQUser.belongsToMany(SQPlan, { as: 'PlansToAttend', through: SQUserPlan, foreignKey: 'userId' });
SQPlan.belongsTo(SQUser, { as: 'Creator' });

const SQPushSub = sequelize.define('push_sub', {
  endpoint: Sequelize.STRING,
  userPublicKey: Sequelize.STRING,
  userAuthKey: Sequelize.STRING
});

SQUser.hasMany(SQPushSub, { as: 'PushSubs' });

// sequelize.query('SET FOREIGN_KEY_CHECKS = 0').then(() => {
//  return Promise.all([
//    SQUser.sync({ force: true }),
//    SQPlan.sync({ force: true }),
//    SQUserPlan.sync({ force: true }),
//    SQPushSub.sync({ force: true })
//  ]);
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

    const attendeeNames = dbPlan.getAttendees().then((dbAttendees) => {
      // TODO: filter attendeeNames so this doesn't include user
      return dbAttendees.map((dbUser) => dbUser.get('name'));
    });
    const isAttending = dbPlan.hasAttendee(user.dbUser);
    const creator = dbPlan.getCreator().then(Users.getUserFromDBUser);
    const isCreator = creator.then((creatorUser) => {
      return creatorUser.dbUser.get('id') === user.dbUser.get('id')
    });
    const serializedCreator = creator.then((creator) => creator.serializedUser);
    const thumbnail = serializedCreator.then((serializedCreator) => serializedCreator.image);
    const creatorName = serializedCreator.then((serializedCreator) => serializedCreator.name);

    const serializedAttrPromises = {
      attendeeNames,
      isAttending,
      thumbnail,
      creatorName,
      isCreator
    };
    const attrPromises = { creator };

    return promiseAllObj(serializedAttrPromises).then((serializedAttrs) => {
      return promiseAllObj(attrPromises).then((attrs) => {
        return Object.assign({
          dbPlan,
          serializedPlan: Object.assign(
            dbPlan.get({ plain: true }),
            serializedAttrs
          )
        }, attrs);
      })
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
      if (dbPlan) {
        return getPlanFromDBPlanForUser(dbPlan, user);
      } else {
        throw new Error('This user cannot see this plan');
      }
    });
  };

  const setUserAttendingPlanId = (planId, user, isNowAttending) => {
    return getPlanByIdForUser(planId, user).then((plan) => {
      // It looks like modifiying associations doesn't return the updated dbUser
      if (isNowAttending) {
        return plan.dbPlan.addAttendee(user.dbUser);
      } else {
        return plan.dbPlan.removeAttendee(user.dbUser);
      }
    }).then(() => {
      return getPlanByIdForUser(planId, user);
    });
  }

  const updatePlanByIdForUser = (planId, newSerializedPlan, user) => {
    return getPlanByIdForUser(planId, user).then((plan) => {
      if (!plan.serializedPlan.isCreator) {
        throw new Error('This user cannot modify this plan');
      }
      return plan.dbPlan.update(newSerializedPlan);
    }).then((dbPlan) => {
      return getPlanFromDBPlanForUser(dbPlan, user);
    });
  };

  return {
    getPlansVisibleToUser,
    getPlanByIdForUser,
    createPlanForUser,
    updatePlanByIdForUser,
    setUserAttendingPlanId
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

const PushSubs = (() => {
  // TODO: move this to somewhere secure
  webPush.setGCMAPIKey('AIzaSyAAxf-66b5V2lsH7Son8Bd0scLtKMcYztA');

  const getPushSubFromDBPushSub = (dbPushSub) => {
    return { dbPushSub, serializedPushSub: dbPushSub.get({ plain: true }) };
  };

  const createPushSubForUser = (endpoint, userPublicKey, userAuthKey, user) => {
    return SQPushSub.create({ endpoint, userPublicKey, userAuthKey }).then((dbPushSub) => {
      return user.dbUser.addPushSub(dbPushSub).then(() => {
        return getPushSubFromDBPushSub(dbPushSub);
      });
    });
  };

  const sendNotificationToUser = ({ title, body, url, tag }, user) => {
    console.log('Sending a notification to ', user.serializedUser.name);
    return user.dbUser.getPushSubs().then((dbPushSubs) => {
      return Promise.all(dbPushSubs.map((dbPushSub) => {
        const endpoint = dbPushSub.get('endpoint');
        const userPublicKey = dbPushSub.get('userPublicKey');
        // The web-push library expects this to be called userAuth not userAuthKey
        const userAuth = dbPushSub.get('userAuthKey');
        return webPush.sendNotification(endpoint, {
          TTL: 24 * 60 * 60,
          userPublicKey,
          userAuth,
          payload: JSON.stringify({ title, body, url, tag })
        }).then((result) => {
          console.log(result, userPublicKey, userAuth);
        });
      }));
    });
  }
  return { createPushSubForUser, sendNotificationToUser };
})();

// TODO: set up notifications

module.exports = { Users, Sessions, Plans, PushSubs }
