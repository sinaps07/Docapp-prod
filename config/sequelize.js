const { Sequelize } = require("sequelize");

function normalizeDbUrl(rawUrl) {
  if (!rawUrl) return null;
  let value = String(rawUrl).trim();

  // Accept pasted commands like: psql 'postgresql://...'
  if (value.toLowerCase().startsWith("psql ")) {
    const match = value.match(/postgres(?:ql)?:\/\/\S+/i);
    value = match ? match[0] : "";
  }

  // Strip wrapping quotes if present.
  if (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    value = value.slice(1, -1);
  }

  return value;
}

const databaseUrl = normalizeDbUrl(process.env.DATABASE_URL);
const url = databaseUrl || "postgres://postgres:postgres@127.0.0.1:5432/docapp";
const sslFromEnv = process.env.PGSSL === "true" || process.env.DATABASE_SSL === "true";
const sslFromUrl = /sslmode=require|ssl=true/i.test(url);

if (!/^postgres(?:ql)?:\/\//i.test(url)) {
  throw new Error(
    "Invalid DATABASE_URL. Use format: postgresql://USER:PASSWORD@HOST:5432/DATABASE"
  );
}

const sequelize = new Sequelize(url, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl:
      sslFromEnv || sslFromUrl
        ? { require: true, rejectUnauthorized: false }
        : false,
  },
});

module.exports = sequelize;
