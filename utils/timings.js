const moment = require("moment");

function normalizeTimeValue(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (moment.isMoment(value)) {
    return value.format("HH:mm");
  }

  if (value instanceof Date) {
    return moment(value).format("HH:mm");
  }

  const raw = String(value).trim();
  if (!raw) {
    return "";
  }

  const strictParsed = moment(raw, ["HH:mm", "H:mm", "hh:mm A", "h:mm A", moment.ISO_8601], true);
  if (strictParsed.isValid()) {
    return strictParsed.format("HH:mm");
  }

  const fallbackParsed = moment(raw);
  return fallbackParsed.isValid() ? fallbackParsed.format("HH:mm") : raw;
}

function normalizeTimings(timings) {
  if (!Array.isArray(timings)) {
    return [];
  }

  return timings.slice(0, 2).map(normalizeTimeValue);
}

function areValidTimings(timings) {
  if (!Array.isArray(timings) || timings.length !== 2) {
    return false;
  }

  const start = moment(timings[0], "HH:mm", true);
  const end = moment(timings[1], "HH:mm", true);

  return start.isValid() && end.isValid() && end.isAfter(start);
}

module.exports = {
  normalizeTimeValue,
  normalizeTimings,
  areValidTimings,
};
