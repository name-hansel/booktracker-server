import { RegisterUser } from "../interfaces";

export const registrationValidation = ({
  username,
  email,
  password,
}: RegisterUser) => {
  if (username && (username.length < 6 || username.length > 32))
    return "Invalid username";
  if (
    !email.match(
      /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
    )
  )
    return "Invalid email";
  if (!password.match(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/))
    return "Invalid password type. Must contain minimum eight characters, at least one letter and one number.";
};
