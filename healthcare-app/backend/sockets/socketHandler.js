const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Appointment = require("../models/appointment");
const Message = require("../models/message");

const getAppointmentForUser = async (appointmentId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    return null;
  }

  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    return null;
  }

  const isParticipant =
    String(appointment.patientId) === String(userId) || String(appointment.doctorId) === String(userId);

  return isParticipant ? appointment : null;
};

const registerSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      socket.disconnect(true);
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
    } catch (_error) {
      socket.disconnect(true);
      return;
    }

    console.log(`Socket connected: ${socket.id}`);

    socket.on("joinRoom", async ({ appointmentId, roomId }) => {
      const targetRoom = roomId || appointmentId;

      if (!targetRoom) {
        return;
      }

      const appointment = await getAppointmentForUser(targetRoom, socket.userId);
      if (!appointment) {
        socket.emit("errorMessage", { msg: "You are not authorized to join this room" });
        return;
      }

      socket.join(targetRoom);
      socket.emit("joinedRoom", {
        roomId: targetRoom,
        message: `Joined room ${targetRoom}`
      });
    });

    socket.on("sendMessage", async ({ roomId, appointmentId, message }) => {
      const targetRoom = roomId || appointmentId;
      const trimmedMessage = typeof message === "string" ? message.trim() : "";

      if (!targetRoom || !trimmedMessage) {
        return;
      }

      const appointment = await getAppointmentForUser(targetRoom, socket.userId);
      if (!appointment) {
        socket.emit("errorMessage", { msg: "You are not authorized to send messages here" });
        return;
      }

      const savedMessage = await Message.create({
        appointmentId: targetRoom,
        senderId: socket.userId,
        text: trimmedMessage
      });

      const payload = {
        _id: savedMessage._id,
        roomId: targetRoom,
        appointmentId: targetRoom,
        text: savedMessage.text,
        message: savedMessage.text,
        senderId: String(savedMessage.senderId),
        createdAt: savedMessage.createdAt
      };

      io.to(targetRoom).emit("receiveMessage", payload);
    });

    socket.on("slotBooked", (data) => {
      io.emit("slotBooked", data);
    });

    socket.on("slotUpdated", (data) => {
      io.emit("slotUpdated", data);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = registerSocketHandlers;