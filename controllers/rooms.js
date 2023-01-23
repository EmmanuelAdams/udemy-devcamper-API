const path = require('path');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Room = require('../models/Room');
const Hotel = require('../models/Hotel');

// @desc      Get rooms
// @route     GET  /api/v1/rooms
// @route     GET  /api/v1/hotels/:hotelId/rooms
// @access    Public
exports.getRooms = asyncHandler(async (req, res, next) => {
  if (req.params.hotelId) {
    const rooms = await Room.find({
      hotel: req.params.hotelId,
    });

    return res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms,
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc      Get single room
// @route     GET  /api/v1/rooms/:id
// @access    Public
exports.getRoom = asyncHandler(async (req, res, next) => {
  const room = await Room.findById(req.params.id).populate({
    path: 'hotel',
    select: 'name description',
  });

  if (!room) {
    return next(
      new ErrorResponse(
        `No room with the id of ${req.params.id}`
      ),
      404
    );
  }

  res.status(200).json({
    success: true,
    data: room,
  });
});

// @desc      Add room
// @route     POST /api/v1/hotels/:hotelId/rooms
// @access    Private
exports.addRoom = asyncHandler(async (req, res, next) => {
  req.body.hotel = req.params.hotelId;
  req.body.user = req.user.id;

  const hotel = await Hotel.findById(req.params.hotelId);
  if (!hotel) {
    return next(
      new ErrorResponse(
        `No hotel with the id of ${req.params.hotelId}`
      ),
      404
    );
  }

  // Make sure logged in user is hotel owner
  if (
    hotel.user.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to add a room to ${hotel._id}`,
        401
      )
    );
  }

  const room = await Room.create(req.body);

  res.status(200).json({
    success: true,
    data: room,
  });
});

// @desc      Update room
// @route     PUT /api/v1/rooms/:id
// @access    Private
exports.updateRoom = asyncHandler(
  async (req, res, next) => {
    let room = await Room.findById(req.params.id);

    if (!room) {
      return next(
        new ErrorResponse(
          `No room with the id of ${req.params.id}`
        ),
        404
      );
    }

    // Make sure logged in user is room owner
    if (
      room.user.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to update room ${room._id}`,
          401
        )
      );
    }

    room = await Room.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      data: room,
    });
  }
);

// @desc      Delete room
// @route     DELETE /api/v1/rooms/:id
// @access    Private
exports.deleteRoom = asyncHandler(
  async (req, res, next) => {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return next(
        new ErrorResponse(
          `No room with the id of ${req.params.id}`
        ),
        404
      );
    }

    // Make sure logged in user is room owner
    if (
      room.user.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to delete room ${room._id}`,
          401
        )
      );
    }

    await room.remove();

    res.status(200).json({
      success: true,
      data: {},
    });
  }
);

// @desc      Upload photo for room
// @route     PUT  /api/v1/rooms/:id/photo
// @access    Private
exports.roomPhotoUpload = asyncHandler(
  async (req, res, next) => {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return next(
        new ErrorResponse(
          `Room not found with id of ${req.params.id}`,
          404
        )
      );
    }

    // Make sure logged in user is room owner
    if (
      room.user.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.params.id} is not authorized to update this room`,
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
    file.name = `photo_${room._id}${
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

        await Room.findByIdAndUpdate(req.params.id, {
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
