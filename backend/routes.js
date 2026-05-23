const express = require('express');
const { Log, Habit, Settings, Journey, Objective } = require('./models');

const router = express.Router();

// --- Logs Routes ---
router.get('/logs', async (req, res) => {
  const logs = await Log.find();
  const logMap = {};
  logs.forEach(l => logMap[l.dateKey] = l);
  res.json(logMap);
});

router.post('/logs/:dateKey', async (req, res) => {
  const { dateKey } = req.params;
  const data = req.body;
  const log = await Log.findOneAndUpdate({ dateKey }, data, { upsert: true, new: true });
  res.json(log);
});

router.delete('/logs/:dateKey', async (req, res) => {
  await Log.findOneAndDelete({ dateKey: req.params.dateKey });
  res.sendStatus(200);
});

// --- Habits Routes ---
router.get('/habits', async (req, res) => {
  const habits = await Habit.find();
  res.json(habits);
});

router.post('/habits', async (req, res) => {
  const newHabit = new Habit(req.body);
  await newHabit.save();
  res.json(newHabit);
});

router.put('/habits/:id', async (req, res) => {
  const updated = await Habit.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

router.delete('/habits/:id', async (req, res) => {
  await Habit.findByIdAndDelete(req.params.id);
  res.sendStatus(200);
});

// --- Settings Routes ---
router.get('/settings', async (req, res) => {
  let settings = await Settings.findOne({ userId: 'default-user' });
  
  if (!settings) {
    settings = new Settings({
      userId: 'default-user',
      routines: { 'default': { name: 'Default Routine', theme: 'Building Consistency', dropThreshold: 75, tasks: [] } },
      activeRoutineId: 'default',
      isDarkMode: false
    });
    await settings.save();
  }
  
  res.json(settings);
});

router.post('/settings', async (req, res) => {
  const settings = await Settings.findOneAndUpdate(
    { userId: 'default-user' }, 
    req.body, 
    { upsert: true, new: true }
  );
  res.json(settings);
});

// --- Journey Routes ---
router.get('/journeys', async (req, res) => {
  const journeys = await Journey.find();
  res.json(journeys);
});

router.post('/journeys', async (req, res) => {
  const newJourney = new Journey({
      ...req.body,
      createdAt: new Date().toISOString(),
      entries: []
  });
  await newJourney.save();
  res.json(newJourney);
});

router.put('/journeys/:id', async (req, res) => {
  const updated = await Journey.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

router.delete('/journeys/:id', async (req, res) => {
  await Journey.findByIdAndDelete(req.params.id);
  res.sendStatus(200);
});

// ----------DashBoard----------
router.get('/objectives', async (req, res) => {
  const objectives = await Objective.find().sort({ completed: 1, createdAt: -1 });
  res.json(objectives);
});

router.post('/objectives', async (req, res) => {
  const newObj = new Objective({
      ...req.body,
      createdAt: new Date().toISOString()
  });
  await newObj.save();
  res.json(newObj);
});

// Irreversible completion route
router.put('/objectives/:id/complete', async (req, res) => {
  const updated = await Objective.findByIdAndUpdate(
      req.params.id, 
      { completed: true, completedAt: new Date().toISOString() }, 
      { new: true }
  );
  res.json(updated);
});

router.delete('/objectives/:id', async (req, res) => {
  await Objective.findByIdAndDelete(req.params.id);
  res.sendStatus(200);
});

module.exports = router;