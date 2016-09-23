'use strict';
module.exports = function(sequelize, DataTypes) {
  var SQUser = sequelize.define('SQUser', {
    name: DataTypes.STRING,
    fbId: DataTypes.STRING,
    fbToken: DataTypes.STRING,
    friends: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        SQUser.belongsToMany(models.SQPlan, {
          as: 'plansToAttend',
          through: models.SQUserPlan,
          foreignKey: 'userId'
        })
        SQUser.hasMany(models.SQPushSub, { as: 'pushSubs' })
      }
    }
  });
  return SQUser;
};
