const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, 'Please add a Room title'],
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  available: {
    type: Boolean,
    default: true,
    required: [true, 'Please add availability'],
  },
  cost: {
    type: Number,
    required: [true, 'Please add room cost'],
  },
  roomType: {
    // Array of strings
    type: [String],
    required: true,
    enum: ['Single', 'Double', 'Tripple', 'King Size'],
  },
  minimumOccupancy: {
    type: Number,
    min: 1,
    max: 5,
    required: [
      true,
      'Please add number occupants between 1 and 5',
    ],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  hotel: {
    type: mongoose.Schema.ObjectId,
    ref: 'Hotel',
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
});

// Static method to get average of costs
RoomSchema.statics.getAverageCost = async function (
  hotelId
) {
  const obj = await this.aggregate([
    {
      $match: { hotel: hotelId },
    },
    {
      $group: {
        _id: '$hotel',
        averageCost: { $avg: '$cost' },
      },
    },
  ]);

  try {
    await this.model('Hotel').findByIdAndUpdate(hotelId, {
      averageCost: Math.ceil(obj[0].averageCost / 10) * 10,
    });
  } catch (err) {
    console.error(err);
  }
};

// Call getAverageCost after save
RoomSchema.post('save', function () {
  this.constructor.getAverageCost(this.hotel);
});

// Call getAverageCost before remove
RoomSchema.pre('remove', function () {
  this.constructor.getAverageCost(this.hotel);
});

module.exports = mongoose.model('Room', RoomSchema);
