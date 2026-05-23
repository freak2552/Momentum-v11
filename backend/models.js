
const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  dateKey: { type: String, required: true, unique: true },
  percentage: Number,
  tasks: Array,
  note: String,
  theme: String,
  timestamp: String
});
const Log = mongoose.model('Log', LogSchema);

const HabitSchema = new mongoose.Schema({
  name: String,
  monthKey: String,
  grid: [String],
  createdAt: String
});
const Habit = mongoose.model('Habit', HabitSchema);

const SettingsSchema = new mongoose.Schema({
  userId: { type: String, default: 'default-user' },
  routines: Object,
  activeRoutineId: String,
  isDarkMode: Boolean
});
const Settings = mongoose.model('Settings', SettingsSchema);

const JourneySchema = new mongoose.Schema({
  name: String,
  description: String,
  entries: Array, // This will store our string logs and dates
  createdAt: String
});
const Journey = mongoose.model('Journey', JourneySchema);

const ObjectiveSchema = new mongoose.Schema({
  title: String,
  hardness: String,
  completed: { type: Boolean, default: false },
  expiryDate: String,
  createdAt: String,
  completedAt: String
});
const Objective = mongoose.model('Objective', ObjectiveSchema);

module.exports = { Log, Habit, Settings, Journey, Objective };