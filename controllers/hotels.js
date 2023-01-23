const path = require('path');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const geocoder = require('../utils/geocoder');
const Hotel = require('../models/Hotel');
const { stringify } = require('querystring');

// @desc      Get all hotels
// @route     GET  /api/v1/hotels
// @access    Public
exports.getHotels = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc      Get single hotel
// @route     GET  /api/v1/hotels/:id
// @access    Public
exports.getHotel = asyncHandler(async (req, res, next) => {
  const hotel = await Hotel.findById(req.params.id);

  if (!hotel) {
    return next(
      new ErrorResponse(
        `Hotel not found with id of ${req.params.id}`,
        404
      )
    );
  }

  res.status(200).json({
    success: true,
    data: hotel,
  });
});

// @desc      Create new hotel
// @route     POST  /api/v1/hotels/:id
// @access    Public
exports.createHotel = asyncHandler(
  async (req, res, next) => {
    req.body.user = req.user.id;

    const publishedHotel = await Hotel.findOne({
      user: req.user.id,
    });

    if (publishedHotel && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(
          `The user with ID:${req.user.id} has already published a hotel`,
          400
        )
      );
    }

    const hotel = await Hotel.create(req.body);

    res.status(201).json({
      success: true,
      data: hotel,
    });
  }
);

// @desc      Update hotel
// @route     PUT  /api/v1/hotels/:id
// @access    Private
exports.updateHotel = asyncHandler(
  async (req, res, next) => {
    let hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return next(
        new ErrorResponse(
          `Hotel with id of ${req.params.id} not found`,
          404
        )
      );
    }

    // Make sure logged in user is hotel owner
    if (
      hotel.user.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.params.id} is not authorized to update this hotel`,
          401
        )
      );
    }

    hotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({ success: true, data: hotel });
  }
);

// @desc      Delete hotel
// @route     DELETE  /api/v1/hotels/:id
// @access    Private
exports.deleteHotel = asyncHandler(
  async (req, res, next) => {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return next(
        new ErrorResponse(
          `Hotel not found with id of ${req.params.id}`,
          404
        )
      );
    }

    // Make sure logged in user is hotel owner
    if (
      hotel.user.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.params.id} is not authorized to delete this hotel`,
          401
        )
      );
    }

    hotel.remove();

    res.status(200).json({
      success: true,
      data: {},
    });
  }
);

// @desc      Get hotels within a radius
// @route     DELETE  /api/v1/hotels/radius/:zipcode/:distance
// @access    Private
exports.getHotelsRadius = asyncHandler(
  async (req, res, next) => {
    const { zipcode, distance } = req.params;

    // Get lat/lng from geocoder
    const loc = await geocoder.geocode(zipcode);
    const lat = loc[0].latitude;
    const lng = loc[0].longitude;

    // calc radius using radians
    // Divide distance by radius of Earth
    // Earth Radius = 3,963 mi
    const radius = distance / 3963;

    const hotels = await Hotel.find({
      location: {
        $geoWithin: { $centerSphere: [[lng, lat], radius] },
      },
    });

    res.status(200).json({
      success: true,
      count: hotels.length,
      data: hotels,
    });
  }
);

// @desc      Upload photo for hotel
// @route     PUT  /api/v1/hotels/:id/photo
// @access    Private
exports.hotelPhotoUpload = asyncHandler(
  async (req, res, next) => {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return next(
        new ErrorResponse(
          `Hotel not found with id of ${req.params.id}`,
          404
        )
      );
    }

    // Make sure logged in user is hotel owner
    if (
      hotel.user.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.params.id} is not authorized to update this hotel`,
          401
        )
      );
    }

    if (!req.files) {
      return next(
        new ErrorResponse('Please upload a file', 400)
      );
    }

    const file = req.files.file;

    // // Make sure the file is an image
    if (!file.mimetype.startsWith('image')) {
      return next(
        new ErrorResponse(
          'Please upload an image file',
          400
        )
      );
    }

    // Check file size
    if (file.size > process.env.MAX_FILE_UPLOAD) {
      return next(
        new ErrorResponse(
          `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
          400
        )
      );
    }

    // Create custom filename
    file.name = `photo_${hotel._id}${
      path.parse(file.name).ext
    }`;

    file.mv(
      `${process.env.FILE_UPLOAD_PATH}/${file.name}`,
      async (err) => {
        if (err) {
          console.error(err);
          return next(
            new ErrorResponse(
              'Problem with file upload',
              500
            )
          );
        }

        await Hotel.findByIdAndUpdate(req.params.id, {
          photo: file.name,
        });

        res.status(200).json({
          success: true,
          data: file.name,
        });
      }
    );
  }
);
