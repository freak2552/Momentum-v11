const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

// Import your decoupled routes
const apiRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());

// --- MongoDB Connection ---
//mongodb.net/?appName=AscendX") -> for the original database
//mongodb.net/my_second_app_db?appName=AscendX") -> for the trial database

mongoose.connect("mongodb+srv://riteshtry25_db_user:38cevRXMaE5OzlKx@ascendx.hfyxuls.mongodb.net/?appName=AscendX")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// --- API Routes ---
// This mounts all the routes from routes.js under the /api prefix
app.use('/api', apiRoutes);

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});