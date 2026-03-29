const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Doctor = sequelize.define(
    "Doctor",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "user_id",
        references: { model: "users", key: "id" },
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "first_name",
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "last_name",
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      website: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      specialization: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      experience: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      feesPerCunsaltation: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "fees_per_cunsaltation",
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "pending",
      },
      timings: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
    },
    {
      tableName: "doctors",
      timestamps: true,
      underscored: true,
    }
  );

  return Doctor;
};
