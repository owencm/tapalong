'use strict';
module.exports = function(sequelize, DataTypes) {
  var SQPushSub = sequelize.define('SQPushSub', {
    endpoint: DataTypes.STRING,
    userPublicKey: DataTypes.STRING,
    userAuthKey: DataTypes.STRING,
    userId: DataTypes.INTEGER,
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return SQPushSub;
};
