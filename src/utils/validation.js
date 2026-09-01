/**
 * Basic email format validator
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate password strength (at least 6 characters)
 * @param {string} password
 * @returns {{isValid: boolean, message: string}}
 */
export function validatePassword(password) {
  if (!password || password.length < 6) {
    return {
      isValid: false,
      message: "Password must be at least 6 characters long.",
    };
  }
  return { isValid: true, message: "" };
}

/**
 * Validate image caption length
 * @param {string} caption
 * @param {number} [maxChars=500]
 * @returns {boolean}
 */
export function isValidCaption(caption, maxChars = 500) {
  if (typeof caption !== "string") return false;
  return caption.length <= maxChars;
}
