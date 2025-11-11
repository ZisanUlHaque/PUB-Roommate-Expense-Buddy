// src/utils/emailKey.js
export const emailKey = (email = "") =>
  String(email)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/\./g, ",")
    .replace(/@/g, "_at_");