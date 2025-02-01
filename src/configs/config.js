const { mongoose } = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://sureshalli:Ruhani143@cluster0.sonyefu.mongodb.net/devTinder"
    );
    console.log("connected to mongodb");
  } catch (e) {
    console.log("error while connecting db", e);
  }
};

module.exports = connectDB;