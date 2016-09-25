'use strict';
module.exports = function(sequelize, DataTypes) {
  var SQPlan = sequelize.define('SQPlan', {
    description: DataTypes.STRING,
    startTime: DataTypes.DATE,
    title: DataTypes.STRING,
    cancelled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
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
