const userModel = require("../models/userModels");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const doctorModel = require("../models/doctorModel");
const appointmentModel = require("../models/appointmentModel");
const moment = require("moment");
const { Op } = require("sequelize");
const { normalizeTimings, areValidTimings } = require("../utils/timings");

const notifyAdminAboutDoctorRequest = async (doctorRecord) => {
  const adminUser = await userModel.findOne({ where: { isAdmin: true } });
  if (!adminUser) {
    throw new Error(
      "No admin user is configured. You cannot submit a doctor registration yet."
    );
  }

  const notification = [...(adminUser.notification || [])];
  notification.push({
    type: "apply-doctor-request",
    message: `${doctorRecord.firstName} ${doctorRecord.lastName} has applied for a doctor account.`,
    data: {
      doctorId: doctorRecord.id,
      name: doctorRecord.firstName + " " + doctorRecord.lastName,
      onClickPath: "/admin/docotrs",
    },
  });

  await adminUser.update({ notification });
};

const registerController = async (req, res) => {
  try {
    const requestedAccountType = String(req.body.accountType || "patient")
      .toLowerCase()
      .trim();
    const accountType =
      requestedAccountType === "doctor" ? "doctor" : "patient";
    const existingUser = await userModel.findOne({
      where: { email: req.body.email },
    });
    if (existingUser) {
      return res
        .status(200)
        .send({ message: "User already exists.", success: false });
    }

    if (accountType === "doctor") {
      const normalizedTimings = normalizeTimings(req.body.timings);

      if (!req.body.firstName || !req.body.lastName || !req.body.phone) {
        return res.status(200).send({
          success: false,
          message: "Doctor registration requires first name, last name, and phone number.",
        });
      }

      if (
        !req.body.address ||
        !req.body.specialization ||
        !req.body.experience ||
        !req.body.feesPerCunsaltation
      ) {
        return res.status(200).send({
          success: false,
          message: "Please complete all professional doctor registration details.",
        });
      }

      if (!areValidTimings(normalizedTimings)) {
        return res.status(200).send({
          success: false,
          message: "Please select a valid doctor availability time range.",
        });
      }

      req.body.timings = normalizedTimings;
    }

    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await userModel.create({
      name:
        req.body.name ||
        [req.body.firstName, req.body.lastName].filter(Boolean).join(" "),
      email: req.body.email,
      password: hashedPassword,
      isAdmin: false,
      isDoctor: false,
      accountType,
      notification: [],
      seennotification: [],
    });

    if (accountType === "doctor") {
      const newDoctor = await doctorModel.create({
        userId: newUser.id,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
        email: req.body.email,
        website: req.body.website,
        address: req.body.address,
        specialization: req.body.specialization,
        experience: req.body.experience,
        feesPerCunsaltation: req.body.feesPerCunsaltation,
        status: "pending",
        timings: req.body.timings,
      });

      await notifyAdminAboutDoctorRequest(newDoctor);

      return res.status(201).send({
        message:
          "Doctor registration submitted successfully. Your account will be available after admin approval.",
        success: true,
      });
    }

    res.status(201).send({ message: "Registered successfully.", success: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: `Registration failed: ${error.message}`,
    });
  }
};

const loginController = async (req, res) => {
  try {
    const requestedRole = String(req.body.role || "")
      .toLowerCase()
      .trim();
    const user = await userModel.findOne({
      where: { email: req.body.email },
    });
    if (!user) {
      return res
        .status(200)
        .send({ message: "User not found.", success: false });
    }
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res
        .status(200)
        .send({ message: "Invalid email or password.", success: false });
    }
    if (requestedRole === "doctor" && user.accountType !== "doctor") {
      return res.status(200).send({
        message:
          "This account is registered as a patient account. Please continue through the patient login page.",
        success: false,
      });
    }
    if (requestedRole === "doctor" && !user.isDoctor) {
      return res.status(200).send({
        message:
          "This account is not approved for doctor access yet. Please use the patient login or wait for doctor approval.",
        success: false,
      });
    }
    if (requestedRole === "patient" && user.accountType === "doctor") {
      return res.status(200).send({
        message:
          "This account is set up as a doctor account. Please continue through the doctor login page.",
        success: false,
      });
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.status(200).send({ message: "Login successful.", success: true, token });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: `Login error: ${error.message}` });
  }
};

const authController = async (req, res) => {
  try {
    const user = await userModel.findByPk(req.body.userId);
    if (!user) {
      return res.status(200).send({
        message: "User not found.",
        success: false,
      });
    }
    const data = user.toJSON();
    delete data.password;
    res.status(200).send({
      success: true,
      data,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Authentication error.",
      success: false,
      error,
    });
  }
};

const applyDoctorController = async (req, res) => {
  try {
    const user = await userModel.findByPk(req.body.userId);
    if (!user) {
      return res.status(200).send({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).send({
      success: false,
      message:
        user.accountType === "patient"
          ? "Patient accounts cannot use Apply Doctor anymore. Please use the dedicated doctor registration route."
          : "Doctor access now uses the dedicated doctor registration route.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Something went wrong while applying as a doctor.",
    });
  }
};

const getAllNotificationController = async (req, res) => {
  try {
    const user = await userModel.findByPk(req.body.userId);
    const notification = [...(user.notification || [])];
    await user.update({
      notification: [],
      seennotification: notification,
    });
    const updatedUser = await userModel.findByPk(req.body.userId);
    res.status(200).send({
      success: true,
      message: "All notifications marked as read.",
      data: updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Could not update notifications.",
      success: false,
      error,
    });
  }
};

const deleteAllNotificationController = async (req, res) => {
  try {
    const user = await userModel.findByPk(req.body.userId);
    user.notification = [];
    user.seennotification = [];
    const updatedUser = await user.save();
    const data = updatedUser.toJSON();
    delete data.password;
    res.status(200).send({
      success: true,
      message: "Notifications deleted successfully.",
      data,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Unable to delete notifications.",
      error,
    });
  }
};

const getAllDocotrsController = async (req, res) => {
  try {
    const doctors = await doctorModel.findAll({
      where: { status: "approved" },
    });
    res.status(200).send({
      success: true,
      message: "Doctor list loaded successfully.",
      data: doctors,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Could not load the doctor list.",
    });
  }
};

const bookeAppointmnetController = async (req, res) => {
  try {
    const doctorInfoRaw = req.body.doctorInfo;
    const userInfoRaw = req.body.userInfo;
    const doctorInfo =
      typeof doctorInfoRaw === "string"
        ? JSON.parse(doctorInfoRaw)
        : doctorInfoRaw;
    const userInfo =
      typeof userInfoRaw === "string" ? JSON.parse(userInfoRaw) : userInfoRaw;
    req.body.date = moment(req.body.date, "DD-MM-YYYY").toISOString();
    req.body.time = moment(req.body.time, "HH:mm").toISOString();
    req.body.status = "pending";
    req.body.doctorInfo =
      typeof doctorInfoRaw === "string"
        ? doctorInfoRaw
        : JSON.stringify(doctorInfoRaw);
    req.body.userInfo =
      typeof userInfoRaw === "string"
        ? userInfoRaw
        : JSON.stringify(userInfoRaw);
    await appointmentModel.create(req.body);
    const user = await userModel.findByPk(doctorInfo.userId);
    const notification = [...(user.notification || [])];
    notification.push({
      type: "New-appointment-request",
      message: `New appointment request from ${userInfo.name}.`,
      onClickPath: "/user/appointments",
      onCLickPath: "/user/appointments",
    });
    await user.update({ notification });
    res.status(200).send({
      success: true,
      message: "Appointment booked successfully.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Could not book the appointment.",
    });
  }
};

const bookingAvailabilityController = async (req, res) => {
  try {
    const date = moment(req.body.date, "DD-MM-YY").toISOString();
    const fromTime = moment(req.body.time, "HH:mm")
      .subtract(1, "hours")
      .toISOString();
    const toTime = moment(req.body.time, "HH:mm").add(1, "hours").toISOString();
    const doctorId = req.body.doctorId;
    const appointments = await appointmentModel.findAll({
      where: {
        doctorId,
        date: new Date(date),
        time: {
          [Op.between]: [new Date(fromTime), new Date(toTime)],
        },
      },
    });
    if (appointments.length > 0) {
      return res.status(200).send({
        message: "This time slot is not available.",
        success: true,
      });
    } else {
      return res.status(200).send({
        success: true,
        message: "This time slot is available.",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Could not check availability.",
    });
  }
};

const userAppointmentsController = async (req, res) => {
  try {
    const appointments = await appointmentModel.findAll({
      where: { userId: req.body.userId },
    });
    res.status(200).send({
      success: true,
      message: "Appointments loaded successfully.",
      data: appointments,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Could not load your appointments.",
    });
  }
};

module.exports = {
  loginController,
  registerController,
  authController,
  applyDoctorController,
  getAllNotificationController,
  deleteAllNotificationController,
  getAllDocotrsController,
  bookeAppointmnetController,
  bookingAvailabilityController,
  userAppointmentsController,
};
