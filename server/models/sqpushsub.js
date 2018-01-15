'use strict';
module.exports = function(sequelize, DataTypes) {
  var SQPushSub = sequelize.define('SQPushSub', {
    endpoint: DataTypes.STRING,
    userPublicKey: DataTypes.STRING,
    userAuthKey: DataTypes.STRING,
    userId: DataTypes.INTEGER,
    type: DataTypes.STRING,
    expoToken: DataTypes.STRING,
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return SQPushSub;
};
