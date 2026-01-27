// src/utils/logger.js

const format = (level, message, meta) => {
  const time = new Date().toISOString();
  return meta
    ? `[${time}] [${level}] ${message} ${JSON.stringify(meta)}`
    : `[${time}] [${level}] ${message}`;
};

const logger = {
  info: (message, meta) => {
    console.log(format("INFO", message, meta));
  },

  warn: (message, meta) => {
    console.warn(format("WARN", message, meta));
  },

  error: (message, meta) => {
    console.error(format("ERROR", message, meta));
  },

  debug: (message, meta) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(format("DEBUG", message, meta));
    }
  },
};

export default logger;
