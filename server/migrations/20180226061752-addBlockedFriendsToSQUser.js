'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'SQUsers',
      'blockedFriends',
      {
				type: Sequelize.STRING,
				defaultValue: '[]'
      }
    )
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'SQUsers',
      'blockedFriends',
    )
  }
};
