const Appointment = require("../models/appointment");
const Message = require("../models/message");
const mongoose = require("mongoose");

exports.saveMessage = async (req, res) => {
  try {
    const { appointmentId, text } = req.body;
    const senderId = req.user.userId;

    if (!appointmentId || !text) {
      return res.status(400).json({ msg: "appointmentId and text are required" });
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      return res.status(400).json({ msg: "Message text cannot be empty" });
    }

    if (trimmedText.length > 1000) {
      return res.status(400).json({ msg: "Message text is too long" });
    }

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ msg: "Invalid appointmentId" });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ msg: "Appointment not found" });
    }

    const isParticipant =
      String(appointment.patientId) === String(senderId) ||
      String(appointment.doctorId) === String(senderId);

    if (!isParticipant) {
      return res.status(403).json({ msg: "You are not allowed to message on this appointment" });
    }

    const message = await Message.create({
      appointmentId,
      senderId,
      text: trimmedText
    });

    const payload = {
      _id: message._id,
      appointmentId: message.appointmentId,
      senderId: String(message.senderId),
      text: message.text,
      createdAt: message.createdAt
    };

    const io = req.app.get("io");
    if (io) {
      io.to(String(appointmentId)).emit("receiveMessage", payload);
    }

    return res.status(201).json({
      msg: "Message sent successfully",
      message: payload
    });
  } catch (error) {
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};