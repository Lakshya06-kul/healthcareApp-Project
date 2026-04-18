const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  getDoctors,
  getMyDoctorProfile,
  upsertDoctorProfile,
  setAvailability,
  toggleOnlineStatus
} = require("../controllers/doctorController");

router.get("/", getDoctors);
router.get("/me", authMiddleware, getMyDoctorProfile);
router.post("/profile", authMiddleware, upsertDoctorProfile);
router.post("/availability", authMiddleware, setAvailability);
router.put("/toggle", authMiddleware, toggleOnlineStatus);

module.exports = router;