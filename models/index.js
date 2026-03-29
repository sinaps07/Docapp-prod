const sequelize = require("../config/sequelize");
const defineUser = require("./User");
const defineDoctor = require("./Doctor");
const defineAppointment = require("./Appointment");

const User = defineUser(sequelize);
const Doctor = defineDoctor(sequelize);
const Appointment = defineAppointment(sequelize);

User.hasMany(Doctor, { foreignKey: "userId", sourceKey: "id" });
Doctor.belongsTo(User, { foreignKey: "userId", targetKey: "id" });

function attachMongoStyleId(Model) {
  Model.prototype.toJSON = function () {
    const plain = this.get({ plain: true });
    return { ...plain, _id: plain.id };
  };
}

attachMongoStyleId(User);
attachMongoStyleId(Doctor);
attachMongoStyleId(Appointment);

module.exports = {
  sequelize,
  User,
  Doctor,
  Appointment,
};
