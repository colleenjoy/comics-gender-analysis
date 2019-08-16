const Sequelize = require('sequelize');
const db = require('../db');

const Character = db.define('character', {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  gender: {
    type: Sequelize.ENUM('male', 'female', 'other'),
  },
});

module.exports = Character;
