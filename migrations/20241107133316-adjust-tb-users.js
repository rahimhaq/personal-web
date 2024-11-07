'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('tb_users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING(255), // VARCHAR(255)
        allowNull: false, // NOT NULL
      },
      email: {
        type: Sequelize.STRING(255), // VARCHAR(255)
        allowNull: false, // NOT NULL
        unique: true, // Untuk memastikan email tidak duplikat
      },
      password: {
        type: Sequelize.STRING(255), // VARCHAR(255)
        allowNull: false, // NOT NULL
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'), // Default ke waktu sekarang
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'), // Default ke waktu sekarang
      },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('tb_users');
  },
};
