const express = require('express');
const {
  getHotels,
  getHotel,
  createHotel,
  updateHotel,
  deleteHotel,
  getHotelsRadius,
  hotelPhotoUpload,
} = require('../controllers/hotels');

const Hotel = require('../models/Hotel');

// Include other resource routers
const roomRouter = require('./rooms');
const reviewRouter = require('./reviews');

const router = express.Router();

const advancedResults = require('../middleware/advancedResults');
const {
  protect,
  authorize,
} = require('../middleware/auth');

// Re-route into other resource routers
router.use('/:hotelId/rooms', roomRouter);
router.use('/:hotelId/reviews', reviewRouter);

router
  .route('/radius/:zipcode/:distance')
  .get(getHotelsRadius);

router
  .route('/')
  .get(advancedResults(Hotel, 'rooms'), getHotels)
  .post(
    protect,
    authorize('publisher', 'admin'),
    createHotel
  );

router
  .route('/:id/photo')
  .put(
    protect,
    authorize('publisher', 'admin'),
    hotelPhotoUpload
  );

router
  .route('/:id')
  .get(getHotel)
  .put(
    protect,
    authorize('publisher', 'admin'),
    updateHotel
  )
  .delete(
    protect,
    authorize('publisher', 'admin'),
    deleteHotel
  );

module.exports = router;
