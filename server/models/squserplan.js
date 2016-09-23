'use strict';
module.exports = function(sequelize, DataTypes) {
  var SQUserPlan = sequelize.define('SQUserPlan', {
    planId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return SQUserPlan;
};