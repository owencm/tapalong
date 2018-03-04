// TODO: This code is all very inefficient with DB queries. Optimize me plz
// TODO: Move from denoting friends as serialized lists into real DB stuffs

const FB = require('fb')
const jwt = require('jsonwebtoken')
const Sequelize = require('sequelize')
const webPush = require('web-push')
const env = process.env.NODE_ENV || 'development';
const colors = require('colors')
const Expo = require('expo-server-sdk')

const { SQPlan, SQUser, SQUserPlan, SQPushSub } = require('./models/index.js')

FB.options({'appSecret': process.env.FB_APP_SECRET});

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

const getAttrs = (dbObj, attrs) => {
 return Object.assign(
   ...attrs.map(attr => {
     return {[attr]: dbObj.get(attr, { plain: true })}
   })
 )
}

const Users = (() => {
  // fbId is a string
  const createUser = (fbId, fbToken, name, friends) => {
    return SQUser.create({ fbId, fbToken, name, friends }).then(getUserFromDBUser);
  };

  const getUserFromDBUser = (dbUser) => {
    let serializedUser = dbUser.get({ plain: true });
    serializedUser.image = `https://graph.facebook.com/${serializedUser.fbId}/picture`;
    // Whitelist the attributes we'll pass through
    serializedUser = {
      id: serializedUser.id,
      fbId: serializedUser.fbId,
      name: serializedUser.name,
      image: serializedUser.image,
    }
    return { dbUser, serializedUser };
  };

  const getUserWithFbId = (fbId) => {
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

  const getFbUser = (fbToken) => {
    FB.setAccessToken(fbToken);
    return new Promise((resolve, reject) => {
      // Request the users ID, name and friends
      FB.api('/me?fields=id,name,friends', (res) => {
        // Note the friends list returned includes only friends that use the app
        // Note the user ID is a string, since it conveys a 64 bit integer which
        //   cannot be accurately represented in JS's floating point number type
        if(!res || res.error) {
         reject(!res ? 'FB API error occurred' : res.error);
         return;
        }
        const friendIds = res.friends.data.map((friend) => friend.id);
        const friendIdsString = JSON.stringify(friendIds);
        resolve({ fbId: res.id, name: res.name, friends: friendIdsString });
      });
    });
  };

  // TODO: Finish me
  // Update all the users in fbIds to reflect the fact that they're friends
  // const updateUsersByFbIdsToBeFriendsWithFbId = (fbIds, fbId) => {
  //   SQUser.findAll({
  //     where: {
  //       fbId: {
  //         $in: fbIds
  //       }
  //     }
  //    }
  //  })
  // }

  // By deafult FB Tokens expire very quickly so swap it for a long-lived token
  const setupLongFbTokenForUser = (user, fbToken) => {
    FB.api('oauth/access_token', {
      client_id: process.env.FB_CLIENT_ID,
      client_secret: process.env.FB_CLIENT_SECRET,
      grant_type: 'fb_exchange_token',
      fb_exchange_token: fbToken
    }, (res) => {
      if(!res || res.error) {
          console.log(!res ? 'error occurred' : res.error);
          return;
      }

      const longFbToken = res.access_token;
      // TODO: Log the user out on the client after this time, probably 60 days
      const expires = res.expires ? res.expires : 0;

      user.dbUser.update({ fbToken: longFbToken });
    });
  }

  // If the user exists, also update their fbtoken with this one
  const getOrCreateUserWithFbToken = (fbToken) => {
    return getFbUser(fbToken).then((fbUser) => {
      // Get the user from the database if they exist
      // Don't use normal chaining style since we may need access to fbUser
      let userPromise = getUserWithFbId(fbUser.fbId)
      return userPromise.then((user) => {
        if (!user) {
          // TODO: Finish me. I decided to be lazy and just refresh friends
            // every time the plan list gets requested
          // setTimeout(() => {
          //   updateUsersByFbIdsToBeFriendsWithFbId(JSON.parse(fbUser.friends), fbUser.fbId);
          // }, 1000);
          return createUser(fbUser.fbId, fbToken, fbUser.name, fbUser.friends).then((user) => {
            return {
              user,
              newlyCreated: true
            }
          });
        } else {
          // The user exists, so return them
          return {
            user,
            newlyCreated: false
          };
        }
      });
    }).then(({ user, newlyCreated }) => {
      // Return the user and newlyCreated but async swap the fbToken for a long-
      //   lived token
      setupLongFbTokenForUser(user, fbToken);
      return { user, newlyCreated };
    }).catch((e) => {
      throw e
    })
  }

  const refreshFbFriendsForUser = (user) => {
    const fbToken = user.dbUser.get('fbToken');
    return getFbUser(fbToken).then(({ fbId, name, friends }) => {
      return user.dbUser.update({friends});
    }).then(() => {
      console.log('Successfully updated list of friends');
    }).catch((e) => {
      console.error('Failed to update list of friends', e);
    });
  }

  const blockUserByIdForUser = (userToBlockId, user) => {
    // Note, friend graphs are keyed by fbID not id, so we need to add the fbID to the blocked list
    const addFBIdToBlockedListForUser = (fbId, user) => {
      let blockedFriends = JSON.parse(user.dbUser.get('blockedFriends') || '[]')
      const newBlockedFriends = [...blockedFriends, fbId]
      return user.dbUser.update({ blockedFriends: JSON.stringify(newBlockedFriends) })
    }

    return getUserWithId(userToBlockId).then((userToBlock) => {
      // Add each user to each others blocked list. Note therefore ACL-wise you can add yourself to anybody's blocked list
      // TODO: don't use blockedFriends for both parties since users should be able to manage who they have blocked but not who has blocked them
      //   When I come to build that feature I'll have to scrape logs to determine who blocked who to fix up the data set :/
      addFBIdToBlockedListForUser(userToBlock.serializedUser.fbId, user)
      addFBIdToBlockedListForUser(user.serializedUser.fbId, userToBlock)
    })

  }

  return {
    createUser,
    getUserWithFbId,
    getOrCreateUserWithFbToken,
    getUserWithId,
    getUserWithIdAndSessionToken,
    getUserFromDBUser,
    refreshFbFriendsForUser,
    blockUserByIdForUser
  }
})();

const Plans = (() => {

  // This has a lot of nasty async stuff and attempts to minimize DB queries...
  //   Sorry it's hard to read.
  // TODO: Improve on readibility for this logic
  const getPlanFromDBPlanForUser = (dbPlan, user) => {

    const dbAttendees = dbPlan.attendees !== undefined ?
      Promise.resolve(dbPlan.attendees) : dbPlan.getAttendees()
    const dbAttendeesExceptUser = dbAttendees.then((dbAttendees) => {
      return dbAttendees.filter((dbUser) => dbUser.get('id') !== user.dbUser.get('id'))
    })
    const attendees = dbAttendeesExceptUser.then((dbAttendees) => {
      return dbAttendees.map((dbUser) => getAttrs(dbUser, ['name', 'id', 'fbId']))
    })
    const isAttending = dbAttendees.then((dbAttendees) => {
      return dbAttendeesExceptUser.then((dbAttendeesExceptUser) => {
        return dbAttendeesExceptUser < dbAttendees
      })
    })

    const dbCreator = dbPlan.creator !== undefined ?
                        Promise.resolve(dbPlan.creator) : dbPlan.getCreator()
    const creator = dbCreator.then(Users.getUserFromDBUser)
    const isCreator = creator.then((creatorUser) => {
      return creatorUser.dbUser.get('id') === user.dbUser.get('id')
    });
    const serializedCreator = creator.then((creator) => creator.serializedUser)
      .then((serializedCreator) => {
        return {
          name: serializedCreator.name,
          id: serializedCreator.id,
          fbId: serializedCreator.fbId,
          thumbnail: serializedCreator.image,
        }
      })

    const serializedAttrPromises = {
      attendees,
      isAttending,
      creator: serializedCreator,
      isCreator
    }
    const attrPromises = { creator }

    const basicSerializedPlan = getAttrs(dbPlan, ['id', 'description', 'title', 'startTime'])

    return promiseAllObj(serializedAttrPromises).then((serializedAttrs) => {
      return promiseAllObj(attrPromises).then((attrs) => {
        /*
          Example output:
            { dbPlan: ..., serializedPlan: ..., creator: ... }
        */
        return Object.assign({
          dbPlan,
          serializedPlan: Object.assign(
            basicSerializedPlan,
            serializedAttrs
          )
        }, attrs);
      })
    });
  }

  const getPlansVisibleToUser = (user) => {
    const rawFriendIds = JSON.parse(user.dbUser.friends);
    const blockedFriendIds = JSON.parse(user.dbUser.blockedFriends || '[]')
    const friendIds = rawFriendIds.filter(id => blockedFriendIds.indexOf(id) === -1)
    return SQPlan.findAll({
      // Find plans that haven't been cancelled that this user either created
      //  or is friends with the creator of
      where: {
        cancelled: false,
        $or: {
          // Can't find a way to do this direction with creator: user.dbUser
          '$creator.id$': user.dbUser.id,
          // Someone in Slack tells me this is the way to do it. Not in the
          //   documentation thoguh...
          '$creator.fbId$': {
            $in: friendIds
          }
        }
      },
      // Include the creator so we use it in the where clause
      // Include the attendees to prevent additional DB lookups
      include: [{
        model: SQUser,
        as: 'creator'
      }, {
        model: SQUser,
        as: 'attendees'
      }]
    }).then((dbPlans) => {
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

  const cancelPlanByIdForUser = (planId, user) => {
    return getPlanByIdForUser(planId, user).then((plan) => {
      if (!plan.serializedPlan.isCreator) {
        throw new Error('This user cannot modify this plan');
      }
      return plan.dbPlan.update({ cancelled: true })
    }).then((dbPlan) => {
      return getPlanFromDBPlanForUser(dbPlan, user)
    }).catch((e) => {
      throw e
    })
  }

  return {
    getPlansVisibleToUser,
    getPlanByIdForUser,
    createPlanForUser,
    cancelPlanByIdForUser,
    updatePlanByIdForUser,
    setUserAttendingPlanId,
  };
})();

const Sessions = (() => {
  const sessionSecret = process.env.SESSION_SECRET;

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
  // TODO: reset GCM key, old one was in github repo
  webPush.setGCMAPIKey(process.env.GCM_API_KEY);

  const getPushSubFromDBPushSub = (dbPushSub) => {
    return { dbPushSub, serializedPushSub: dbPushSub.get({ plain: true }) };
  };

  const createPushSubForUser = (user, {type, expoToken, endpoint, userPublicKey, userAuthKey}) => {
    const userId = user.serializedUser.id
    if (type === 'expo') {
      return SQPushSub.findOrCreate({where: { expoToken, userId, type }}).spread((dbPushSub) => {
        // I think this is unused
        return getPushSubFromDBPushSub(dbPushSub)
      })
    } else {
      console.error('push subscription type not supported')
    }

    // return SQPushSub.findOrCreate({where: { endpoint, userPublicKey, userAuthKey }}).spread((dbPushSub) => {
    //   return user.dbUser.addPushSub(dbPushSub).then(() => {
    //     return getPushSubFromDBPushSub(dbPushSub);
    //   });
    // });
  };

  const sendNotificationToUser = ({ title = '', body = '', url = '', tag = '' }, user) => {
    console.log('Attempt to notify', user.serializedUser.name);
    return user.dbUser.getPushSubs().then((dbPushSubs) => {
      return Promise.all(dbPushSubs.map((dbPushSub) => {

        if (dbPushSub.get('type') === 'expo') {
          let message = {
            to: dbPushSub.get('expoToken'),
            sound: 'default',
            title,
            body,
            // data: { withSome: 'data' },
          }

          let expo = new Expo()
          console.log('Sending notification to', user.serializedUser.name,'via', dbPushSub.get('expoToken'))
          setTimeout(() => {
            expo.sendPushNotificationsAsync([message]).catch((e) => {
              // Expo sometimes fails with 502 errors so retry failures after 10 seconds
              setTimeout(() => {
                expo.sendPushNotificationsAsync([message]).catch((e) => {
                  console.error(e)
                })
              }, 10000)
            })
          }, 3000)
        } else {
          // TODO: implement
          console.error('Push subscription type for this user not supported')
        }

        // const endpoint = dbPushSub.get('endpoint');
        // const userPublicKey = dbPushSub.get('userPublicKey');
        // // The web-push library expects this to be called userAuth not userAuthKey
        // const userAuth = dbPushSub.get('userAuthKey');
        // return webPush.sendNotification(endpoint, {
        //   TTL: 24 * 60 * 60,
        //   userPublicKey,
        //   userAuth,
        //   payload: JSON.stringify({ title, body, url, tag })
        // }).then((result) => {
        //   console.log(result, userPublicKey, userAuth);
        // });
      }));
    });
  }
  return { createPushSubForUser, sendNotificationToUser };
})();

// TODO: set up notifications

module.exports = { Users, Sessions, Plans, PushSubs }
