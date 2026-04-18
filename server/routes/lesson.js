const router = require('express').Router();
const { getTodayLesson, submitAnswer } = require('../controllers/lessonController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/today', getTodayLesson);
router.post('/answer', submitAnswer);

module.exports = router;
