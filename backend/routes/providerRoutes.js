
const express = require("express");
const protect = require("../middleware/authMiddleware");

const {
    createProviderProfile,
    getProviders,
    getMyProfile
} = require("../controllers/providerController");

const router = express.Router();

router.post("/profile", protect, createProviderProfile);

// Get all providers for customer search
router.get("/", getProviders);

// Get logged-in provider's own profile
router.get("/my-profile", protect, getMyProfile);

module.exports = router;


