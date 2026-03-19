// src/utils/auth.js
const USER_KEY = "loginId";

export function setCurrentUserId(loginId) {
  localStorage.setItem(USER_KEY, loginId);
}

export function getCurrentUserId() {
  return localStorage.getItem(USER_KEY);
}

export function clearCurrentUserId() {
  localStorage.removeItem(USER_KEY);
}
