import mongoose from "mongoose";

export interface User extends mongoose.Document {
  username: string;
  email: string;
  password: string;
  activated: boolean;
  loggedIn: boolean;
}

const userSchema = new mongoose.Schema<User>({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  activated: {
    type: Boolean,
    default: false,
  },
  loggedIn: {
    type: Boolean,
    default: false,
  },
});

const User = mongoose.model<User>("user", userSchema);

export default User;
