'use strict';
module.exports = function(sequelize, DataTypes) {
  var SQPlan = sequelize.define('SQPlan', {
    description: DataTypes.STRING,
    startTime: DataTypes.DATE,
    title: DataTypes.STRING,
    cancelled: DataTypes.BOOLEAN,
    creatorId: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        SQPlan.belongsToMany(models.SQUser, {
          as: 'attendees',
          through: models.SQUserPlan,
          foreignKey: 'planId'
        })
        SQPlan.belongsTo(models.SQUser, {
          as: 'creator'
        })
      }
    }
  });
  return SQPlan;
};
