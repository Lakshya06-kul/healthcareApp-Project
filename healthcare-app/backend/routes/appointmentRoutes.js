const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
	bookAppointment,
	getMyAppointments,
	updateAppointmentStatus
} = require("../controllers/appointmentController");

router.post("/book", authMiddleware, bookAppointment);
router.get("/my", authMiddleware, getMyAppointments);
router.put("/:appointmentId/status", authMiddleware, updateAppointmentStatus);

module.exports = router;