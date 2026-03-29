const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Appointment = sequelize.define(
    "Appointment",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "user_id",
      },
      doctorId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "doctor_id",
      },
      doctorInfo: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "doctor_info",
      },
      userInfo: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "user_info",
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending",
      },
      time: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "appointments",
      timestamps: true,
      underscored: true,
    }
  );

  return Appointment;
};
