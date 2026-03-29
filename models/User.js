const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isAdmin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: "is_admin",
      },
      isDoctor: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: "is_doctor",
      },
      notification: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      seennotification: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
    },
    {
      tableName: "users",
      timestamps: true,
      underscored: true,
    }
  );

  return User;
};
