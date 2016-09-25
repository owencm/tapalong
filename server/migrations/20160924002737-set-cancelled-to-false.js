'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.sequelize.query('UPDATE `SQPlans` AS `SQPlan` SET `SQPlan`.`cancelled` = FALSE WHERE `SQPlan`.`cancelled` IS NULL;')
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.sequelize.query('UPDATE `SQPlans` AS `SQPlan` SET `SQPlan`.`cancelled` = NULL WHERE `SQPlan`.`cancelled` = FALSE;')
  }
};
