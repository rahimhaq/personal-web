const { DataTypes } = require("sequelize");
const sequelize = require("../app"); // Ekspor sequelize dari app.js

const Project = sequelize.define("Project", {
  name: { type: DataTypes.STRING, allowNull: false },
  description: DataTypes.TEXT,
  start_date: DataTypes.DATE,
  end_date: DataTypes.DATE,
  technologies: DataTypes.ARRAY(DataTypes.STRING),
  image: DataTypes.STRING,
  author_id: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'Projects',
});

module.exports = Project;
