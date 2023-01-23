const fs = require('fs');
const mongoose = require('mongoose');
const colors = require('colors');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: './config/config.env' });

// Load models
const Hotel = require('./models/Hotel');
const Room = require('./models/Room');
const User = require('./models/User');
const Review = require('./models/Review');

// Connect to DB
mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGO_URI);

// Read JSON files
const hotels = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/hotels.json`, 'utf-8')
);

const rooms = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/rooms.json`, 'utf-8')
);

const users = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/users.json`, 'utf-8')
);

const reviews = JSON.parse(
  fs.readFileSync(
    `${__dirname}/_data/reviews.json`,
    'utf-8'
  )
);

// Import into DB
const importData = async () => {
  try {
    await Hotel.create(hotels);
    await Room.create(rooms);
    await User.create(users);
    await Review.create(reviews);

    console.log('Data imported...'.green.inverse);
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

// Delete data
const deleteData = async () => {
  try {
    await Hotel.deleteMany();
    await Room.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();

    console.log('Data destroyed...'.red.inverse);
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
}
