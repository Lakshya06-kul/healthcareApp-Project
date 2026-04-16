const Appointment = require("../models/appointment");
const Doctor = require("../models/doctor");
const User = require("../models/user");
const mongoose = require("mongoose");

exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, time } = req.body;
    const patientId = req.user.userId;

    if (!doctorId || !date || !time) {
      return res.status(400).json({ msg: "doctorId, date, and time are required" });
    }

    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({ msg: "Patient not found" });
    }

    if (patient.role !== "patient") {
      return res.status(403).json({ msg: "Only patients can book appointments" });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ msg: "Doctor not found" });
    }

    const isBooked = await Appointment.findOne({
      doctorId,
      date,
      time,
      status: { $ne: "cancelled" }
    });

    if (isBooked) {
      return res.status(400).json({ msg: "Slot already booked" });
    }

    // Atomic slot removal prevents two parallel requests from booking the same slot.
    const updatedDoctor = await Doctor.findOneAndUpdate(
      {
        _id: doctorId,
        availability: { $elemMatch: { date, slots: time } }
      },
      {
        $pull: { "availability.$.slots": time }
      },
      { new: true }
    );

    if (!updatedDoctor) {
      return res.status(400).json({ msg: "Selected slot is not available" });
    }

    await Doctor.updateOne(
      { _id: doctorId },
      { $pull: { availability: { date, slots: { $size: 0 } } } }
    );

    const appointment = await Appointment.create({
      doctorId,
      patientId,
      date,
      time,
      status: "booked",
      channelName: "pending"
    });

    appointment.channelName = `appointment_${appointment._id}`;
    await appointment.save();

    const remainingSlots =
      updatedDoctor.availability.find((entry) => entry.date === date)?.slots || [];

    const io = req.app.get("io");
    if (io) {
      io.emit("slotBooked", {
        appointmentId: appointment._id,
        doctorId,
        patientId,
        date,
        time,
        channelName: appointment.channelName
      });

      io.emit("slotUpdated", {
        doctorId,
        date,
        availableSlots: remainingSlots
      });
    }

    return res.status(201).json({
      msg: "Appointment booked successfully",
      appointment
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(400).json({ msg: "Slot already booked" });
    }

    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.getMyAppointments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).lean();

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    let query = {};

    if (user.role === "doctor") {
      const doctor = await Doctor.findOne({ userId }).lean();

      if (!doctor) {
        return res.json({ appointments: [] });
      }

      query = { doctorId: doctor._id };
    } else {
      query = { patientId: userId };
    }

    const appointments = await Appointment.find(query)
      .populate({
        path: "doctorId",
        populate: { path: "userId", select: "name" }
      })
      .populate("patientId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ appointments });
  } catch (error) {
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ msg: "Invalid appointmentId" });
    }

    if (!["completed", "cancelled"].includes(status)) {
      return res.status(400).json({ msg: "Status must be completed or cancelled" });
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ msg: "Appointment not found" });
    }

    if (user.role === "doctor") {
      const doctor = await Doctor.findOne({ userId }).lean();
      if (!doctor || String(doctor._id) !== String(appointment.doctorId)) {
        return res.status(403).json({ msg: "Not allowed to update this appointment" });
      }
    } else if (String(appointment.patientId) !== String(userId)) {
      return res.status(403).json({ msg: "Not allowed to update this appointment" });
    }

    appointment.status = status;
    await appointment.save();

    return res.json({ msg: "Appointment status updated", appointment });
  } catch (error) {
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};
