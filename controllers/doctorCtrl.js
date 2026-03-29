const doctorModel = require("../models/doctorModel");

const getDoctorInfoController = async (req, res) => {
  try {
    const doctor = await doctorModel.findOne({
      where: { userId: req.body.userId },
    });
    res.status(200).send({
      success: true,
      message: "Doctor profile loaded successfully.",
      data: doctor,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Could not load doctor details.",
    });
  }
};

const updateProfileController = async (req, res) => {
  try {
    await doctorModel.update(req.body, {
      where: { userId: req.body.userId },
    });
    const doctor = await doctorModel.findOne({
      where: { userId: req.body.userId },
    });
    res.status(201).send({
      success: true,
      message: "Doctor profile updated.",
      data: doctor,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Could not update doctor profile.",
      error,
    });
  }
};

const getDoctorByIdController = async (req, res) => {
  try {
    const doctor = await doctorModel.findByPk(req.body.doctorId);
    res.status(200).send({
      success: true,
      message: "Doctor details loaded successfully.",
      data: doctor,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Could not load doctor details.",
    });
  }
};

module.exports = {
  getDoctorInfoController,
  updateProfileController,
  getDoctorByIdController,
};
