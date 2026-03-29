const doctorModel = require("../models/doctorModel");
const userModel = require("../models/userModels");

const getAllUsersController = async (req, res) => {
  try {
    const users = await userModel.findAll();
    res.status(200).send({
      success: true,
      message: "User list loaded successfully.",
      data: users,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Could not load users.",
      error,
    });
  }
};

const getAllDoctorsController = async (req, res) => {
  try {
    const doctors = await doctorModel.findAll();
    res.status(200).send({
      success: true,
      message: "Doctor list loaded successfully.",
      data: doctors,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Could not load doctors.",
      error,
    });
  }
};

const changeAccountStatusController = async (req, res) => {
  try {
    const { doctorId, status } = req.body;
    const doctor = await doctorModel.findByPk(doctorId);
    if (!doctor) {
      return res.status(404).send({
        success: false,
        message: "Doctor not found.",
      });
    }
    await doctor.update({ status });
    const user = await userModel.findByPk(doctor.userId);
    const notification = [...(user.notification || [])];
    notification.push({
      type: "doctor-account-request-updated",
      message: `Your doctor account request has been ${status}.`,
      onClickPath: "/notification",
    });
    user.isDoctor = status === "approved";
    user.notification = notification;
    await user.save();
    res.status(201).send({
      success: true,
      message: "Account status updated.",
      data: doctor,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Could not update account status.",
      error,
    });
  }
};

module.exports = {
  getAllDoctorsController,
  getAllUsersController,
  changeAccountStatusController,
};
