const express = require('express');
const router = express.Router();
const {
    loginUser,
    registerUser,
    logoutUser,
    getUserProfile,
    googleLogin,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.post('/register', registerUser);
router.post('/logout', logoutUser);
router.post('/google', googleLogin); // Google Auth
router.get('/me', protect, getUserProfile);

module.exports = router;
