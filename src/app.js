const express = require('express');
const feedbackRoutes = require('./routes/feedback');

const app = express();

app.use(express.json());
app.use('/api/feedback', feedbackRoutes);

app.use((error, request, response, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return response.status(400).json({ message: 'Request body must contain valid JSON' });
  }

  console.error(error);
  return response.status(500).json({ message: 'Internal server error' });
});

module.exports = app;