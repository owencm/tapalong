'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn(
      'SQPlans',
      'cancelled',
      {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    )
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn(
      'SQPlans',
      'cancelled',
      {
        type: Sequelize.BOOLEAN
      }
    )
  }
};
