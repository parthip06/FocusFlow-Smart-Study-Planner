const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/generate', scheduleController.generateSchedule);
router.post('/save', scheduleController.saveSchedule);
router.get('/today', scheduleController.getTodaySchedule);

module.exports = router;
