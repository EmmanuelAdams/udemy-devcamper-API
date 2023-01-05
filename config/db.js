const mongoose = require('mongoose');

const connectDb = async () => {
  mongoose.set('strictQuery', true);
  const conn = await mongoose.connect(
    process.env.MONGO_URI
  );

  console.log(
    `MongoDB Connected: ${conn.connection.host}`.cyan
      .underline.bold
  );
};

module.exports = connectDb;
