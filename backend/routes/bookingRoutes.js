
const express = require("express");
const protect = require("../middleware/authMiddleware");

const {
    createBooking,
    getMyBookings,
    getProviderBookings,
    acceptBooking,
    rejectBooking
} = require("../controllers/bookingController");

const router = express.Router();

router.post("/", protect, createBooking);
router.get("/my", protect, getMyBookings);
router.get("/provider", protect, getProviderBookings);
router.put("/accept/:id", protect, acceptBooking);
router.put("/reject/:id", protect, rejectBooking);

module.exports = router;

