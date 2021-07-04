import mongoose from "mongoose";

const connectDatabase = async () => {
  try {
    if (process.env.MONGOURI !== undefined) {
      await mongoose.connect(process.env.MONGOURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false,
      });
    }
    console.log("Database connected");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

export default connectDatabase;
