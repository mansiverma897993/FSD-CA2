const express = require('express');
const mongoose = require('mongoose');
const Feedback = require('../models/Feedback');

const router = express.Router();

router.post('/', async (request, response, next) => {
  try {
    const body = request.body || {};
    const feedback = await Feedback.create({
      studentName: body.studentName,
      courseName: body.courseName,
      message: body.message,
      rating: body.rating
    });

    return response.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return response.status(400).json({ message: error.message });
    }

    return next(error);
  }
});

router.get('/', async (request, response, next) => {
  const page = Number(request.query.page || 1);
  const limit = Number(request.query.limit || 10);

  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) {
    return response.status(400).json({ message: 'Page and limit must be positive integers' });
  }

  try {
    const [feedback, total] = await Promise.all([
      Feedback.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Feedback.countDocuments()
    ]);

    return response.status(200).json({
      feedback,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id', async (request, response, next) => {
  const { id } = request.params;

  if (!mongoose.isValidObjectId(id)) {
    return response.status(400).json({ message: 'Invalid feedback ID' });
  }

  if (!['Pending', 'Reviewed'].includes(request.body?.status)) {
    return response.status(400).json({ message: 'Status must be Pending or Reviewed' });
  }

  try {
    const feedback = await Feedback.findByIdAndUpdate(
      id,
      { status: request.body.status },
      { new: true, runValidators: true }
    );

    if (!feedback) {
      return response.status(404).json({ message: 'Feedback record not found' });
    }

    return response.status(200).json({ message: 'Feedback status updated successfully', feedback });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return response.status(400).json({ message: error.message });
    }

    return next(error);
  }
});

module.exports = router;