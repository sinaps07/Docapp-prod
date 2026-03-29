const colors = require("colors");
const sequelize = require("./sequelize");
const { User } = require("../models");

const connectDB = async () => {
  if (!process.env.DATABASE_URL?.trim()) {
    console.log(
      "Database connection error: DATABASE_URL is not set. Copy .env.example to .env and add your Postgres URL."
        .bgRed.white
    );
    process.exit(1);
  }
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    const adminCount = await User.count({ where: { isAdmin: true } });
    if (adminCount === 0 && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      const bcrypt = require("bcryptjs");
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);
      await User.create({
        name: process.env.ADMIN_NAME || "Admin",
        email: process.env.ADMIN_EMAIL,
        password: hashedPassword,
        isAdmin: true,
        isDoctor: false,
        notification: [],
        seennotification: [],
      });
      console.log(`Seeded admin user ${process.env.ADMIN_EMAIL}`.bgGreen.white);
    } else if (adminCount === 0) {
      console.log(
        "No admin user in database. Register a user, then set is_admin=true in DB, or set ADMIN_EMAIL and ADMIN_PASSWORD in .env to auto-seed."
          .yellow
      );
    }
    console.log(`PostgreSQL connected`.bgGreen.white);
  } catch (error) {
    console.log(`Database connection error: ${error.message}`.bgRed.white);
    if (error.parent) {
      console.log(String(error.parent.message).yellow);
    }
    process.exit(1);
  }
};

module.exports = connectDB;
