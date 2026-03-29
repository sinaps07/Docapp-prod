const doctorModel = require("../models/doctorModel");
const { normalizeTimings, areValidTimings } = require("../utils/timings");

const getDoctorInfoController = async (req, res) => {
  try {
    const doctor = await doctorModel.findOne({
      where: { userId: req.body.userId },
    });

    const doctorData = doctor ? doctor.toJSON() : null;
    if (doctorData && Array.isArray(doctorData.timings)) {
      doctorData.timings = normalizeTimings(doctorData.timings);
    }

    res.status(200).send({
      success: true,
      message: "Doctor profile loaded successfully.",
      data: doctorData,
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
    const normalizedTimings = normalizeTimings(req.body.timings);

    if (!areValidTimings(normalizedTimings)) {
      return res.status(200).send({
        success: false,
        message: "Please choose a valid start and end time for your availability.",
      });
    }

    await doctorModel.update(
      {
        ...req.body,
        timings: normalizedTimings,
      },
      {
      where: { userId: req.body.userId },
      }
    );
    const doctor = await doctorModel.findOne({
      where: { userId: req.body.userId },
    });
    const doctorData = doctor ? doctor.toJSON() : null;
    if (doctorData && Array.isArray(doctorData.timings)) {
      doctorData.timings = normalizeTimings(doctorData.timings);
    }
    res.status(201).send({
      success: true,
      message: "Doctor profile updated.",
      data: doctorData,
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
    const doctorData = doctor ? doctor.toJSON() : null;
    if (doctorData && Array.isArray(doctorData.timings)) {
      doctorData.timings = normalizeTimings(doctorData.timings);
    }
    res.status(200).send({
      success: true,
      message: "Doctor details loaded successfully.",
      data: doctorData,
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
