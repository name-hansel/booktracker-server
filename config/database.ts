import mongoose from "mongoose";

const connectDatabase = async () => {
  try {
    const uri = process.env.MONGOURI || "";
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });
    console.log("Database connected");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

export default connectDatabase;
