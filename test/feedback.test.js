const assert = require('node:assert/strict');
const { test } = require('node:test');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../src/app');
const Feedback = require('../src/models/Feedback');

test('creates feedback with Pending status', async () => {
  const originalCreate = Feedback.create;
  Feedback.create = async (data) => {
    const feedback = new Feedback(data);
    await feedback.validate();
    return feedback;
  };

  try {
    const response = await request(app)
      .post('/api/feedback')
      .send({ studentName: 'Avery Lee', courseName: 'Biology', message: 'Clear session', rating: 5 });

    assert.equal(response.status, 201);
    assert.equal(response.body.feedback.status, 'Pending');
    assert.equal(response.body.feedback.rating, 5);
  } finally {
    Feedback.create = originalCreate;
  }
});

test('rejects missing fields and ratings outside 1 to 5', async () => {
  const originalCreate = Feedback.create;
  Feedback.create = async (data) => {
    const feedback = new Feedback(data);
    await feedback.validate();
    return feedback;
  };

  try {
    const missingField = await request(app)
      .post('/api/feedback')
      .send({ studentName: 'Avery Lee', courseName: 'Biology', rating: 5 });
    const invalidRating = await request(app)
      .post('/api/feedback')
      .send({ studentName: 'Avery Lee', courseName: 'Biology', message: 'Clear session', rating: 6 });

    assert.equal(missingField.status, 400);
    assert.equal(invalidRating.status, 400);
  } finally {
    Feedback.create = originalCreate;
  }
});

test('returns paginated feedback and total count', async () => {
  const originalFind = Feedback.find;
  const originalCountDocuments = Feedback.countDocuments;
  const records = [{ studentName: 'Sam Rivera', courseName: 'History', message: 'Useful examples', rating: 4 }];
  Feedback.find = () => ({
    sort() {
      return this;
    },
    skip() {
      return this;
    },
    limit() {
      return Promise.resolve(records);
    }
  });
  Feedback.countDocuments = async () => 2;

  try {
    const response = await request(app).get('/api/feedback?page=1&limit=1');

    assert.equal(response.status, 200);
    assert.equal(response.body.page, 1);
    assert.equal(response.body.limit, 1);
    assert.equal(response.body.total, 2);
    assert.equal(response.body.feedback.length, 1);
  } finally {
    Feedback.find = originalFind;
    Feedback.countDocuments = originalCountDocuments;
  }
});

test('updates status and reports missing records', async () => {
  const originalFindByIdAndUpdate = Feedback.findByIdAndUpdate;
  const existingId = new mongoose.Types.ObjectId();
  Feedback.findByIdAndUpdate = async (id, update) => {
    if (id !== existingId.toString()) {
      return null;
    }

    return { _id: existingId, status: update.status };
  };

  try {
    const updated = await request(app)
      .patch(`/api/feedback/${existingId}`)
      .send({ status: 'Reviewed' });
    const missing = await request(app)
      .patch(`/api/feedback/${new mongoose.Types.ObjectId()}`)
      .send({ status: 'Reviewed' });
    const invalidStatus = await request(app)
      .patch(`/api/feedback/${existingId}`)
      .send({ status: 'Complete' });
    const missingStatus = await request(app)
      .patch(`/api/feedback/${existingId}`)
      .send({});

    assert.equal(updated.status, 200);
    assert.equal(updated.body.feedback.status, 'Reviewed');
    assert.equal(missing.status, 404);
    assert.equal(invalidStatus.status, 400);
    assert.equal(missingStatus.status, 400);
  } finally {
    Feedback.findByIdAndUpdate = originalFindByIdAndUpdate;
  }
});