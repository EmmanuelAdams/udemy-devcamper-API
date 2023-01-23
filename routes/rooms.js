const express = require('express');
const {
  getRooms,
  getRoom,
  addRoom,
  updateRoom,
  deleteRoom,
  roomPhotoUpload,
} = require('../controllers/rooms');

const Room = require('../models/Room');

const router = express.Router({ mergeParams: true });

const advancedResults = require('../middleware/advancedResults');
const {
  protect,
  authorize,
} = require('../middleware/auth');

router
  .route('/')
  .get(
    advancedResults(Room, {
      path: 'hotel',
      select: 'name description',
    }),
    getRooms
  )
  .post(protect, authorize('publisher', 'admin'), addRoom);

router
  .route('/:id/photo')
  .post(
    protect,
    authorize('publisher', 'admin'),
    roomPhotoUpload
  );

router
  .route('/:id')
  .get(getRoom)
  .put(protect, authorize('publisher', 'admin'), updateRoom)
  .delete(
    protect,
    authorize('publisher', 'admin'),
    deleteRoom
  );

module.exports = router;
