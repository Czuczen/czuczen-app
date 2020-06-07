const Validator = require("validator");
const isEmpty = require("is-empty");

module.exports = function validateRegisterInput(data) {
  let errors = {};

  // Convert empty fields to an empty string so we can use validator functions
  data.name = !isEmpty(data.name) ? data.name : "";
  data.email = !isEmpty(data.email) ? data.email : "";
  data.password = !isEmpty(data.password) ? data.password : "";
  data.password2 = !isEmpty(data.password2) ? data.password2 : "";

  // Name checks
  if (Validator.isEmpty(data.name)) {
    errors.name = "Pole nick jest wymagane";
  }

  // Email checks
  if (Validator.isEmpty(data.email)) {
    errors.email = "Pole adres e-mail jest wymagane";
  } else if (!Validator.isEmail(data.email)) {
    errors.email = "E-mail jest nieprawidłowy";
  }

  // Password checks
  if (Validator.isEmpty(data.password)) {
    errors.password = "Pole hasło jest wymagane";
  }

  if (Validator.isEmpty(data.password2)) {
    errors.password2 = "Pole potwierdź hasło jest wymagane";
  }

  if (!Validator.isLength(data.password, { min: 6, max: 30 })) {
    errors.password = "Hasło musi posiadać co najmniej 6 znaków";
  }

  if (!Validator.equals(data.password, data.password2)) {
    errors.password2 = "Hasła muszą być takie same";
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};
