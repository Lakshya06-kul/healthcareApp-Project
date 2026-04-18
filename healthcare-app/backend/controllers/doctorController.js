const Doctor = require("../models/doctor");
const User = require("../models/user");

exports.getDoctors = async (_req, res) => {
  try {
    const doctors = await Doctor.find()
      .populate("userId", "name")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ doctors });
  } catch (error) {
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.getMyDoctorProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const doctor = await Doctor.findOne({ userId }).populate("userId", "name email role").lean();

    if (!doctor) {
      return res.status(404).json({ msg: "Doctor profile not found" });
    }

    return res.json({ doctor });
  } catch (error) {
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.upsertDoctorProfile = async (req, res) => {
  try {
    const { specialization, price } = req.body;
    const userId = req.user.userId;

    if (!specialization || price === undefined) {
      return res.status(400).json({ msg: "Specialization and price are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (user.role !== "doctor") {
      return res.status(403).json({ msg: "Only users with doctor role can create profile" });
    }

    const doctor = await Doctor.findOneAndUpdate(
      { userId },
      {
        userId,
        specialization: specialization.trim(),
        price: Number(price)
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    return res.status(200).json({ msg: "Doctor profile saved", doctor });
  } catch (error) {
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.setAvailability = async (req, res) => {
  try {
    const { availability } = req.body;
    const userId = req.user.userId;

    if (!Array.isArray(availability)) {
      return res.status(400).json({ msg: "Availability must be an array" });
    }

    for (const item of availability) {
      if (!item.date || !Array.isArray(item.slots)) {
        return res.status(400).json({ msg: "Each availability item must include date and slots[]" });
      }
    }

    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      return res.status(404).json({ msg: "Doctor profile not found" });
    }

    doctor.availability = availability;
    await doctor.save();

    return res.json({ msg: "Availability updated", availability: doctor.availability });
  } catch (error) {
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.toggleOnlineStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const doctor = await Doctor.findOne({ userId });

    if (!doctor) {
      return res.status(404).json({ msg: "Doctor profile not found" });
    }

    doctor.isOnline = !doctor.isOnline;
    await doctor.save();

    return res.json({ msg: "Online status updated", isOnline: doctor.isOnline });
  } catch (error) {
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};