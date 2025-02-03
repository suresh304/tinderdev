const { mongoose } = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.DB_CONNECTION_STRING
    );
    console.log("connected to mongodb");
  } catch (e) {
    console.log("error while connecting db", e);
  }
};

module.exports = connectDB;