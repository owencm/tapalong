'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn(
      'plan',
      'description',
      {
        type: Sequelize.STRING(1024)
      }
    )
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn(
      'plan',
      'description',
      {
        type: Sequelize.STRING
      }
    )
  }
};
