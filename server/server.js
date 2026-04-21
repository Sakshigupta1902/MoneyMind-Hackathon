const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({ 
  origin: function(origin, callback) {
    return callback(null, true);
  }, 
  credentials: true 
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/investment', require('./routes/investment'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/lesson', require('./routes/lesson'));
app.use('/api/reward', require('./routes/reward'));
app.use('/api/budget', require('./routes/budget'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/market', require('./routes/market'));
app.use('/api/networth', require('./routes/networth'));

// Health check route
app.get('/', (req, res) => {
  res.send('MoneyMind API is running perfectly! 🚀');
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch((err) => console.error('MongoDB connection error:', err));
