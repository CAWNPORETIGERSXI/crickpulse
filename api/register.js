const admin = require("./firebase-admin");
const bcrypt = require("bcryptjs");

const db = admin.firestore();

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const {
      mobile,
      email,
      pin,
    } = req.body || {};

    if (!/^[6-9]\d{9}$/.test(mobile || "")) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "")) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address.",
      });
    }

    if (!/^\d{4}$/.test(pin || "")) {
      return res.status(400).json({
        success: false,
        message: "PIN must contain exactly 4 digits.",
      });
    }

    const userRef = db
      .collection("users")
      .doc(mobile);

    const existingUser = await userRef.get();

    if (existingUser.exists) {
      return res.status(409).json({
        success: false,
        message: "An account with this mobile number already exists.",
      });
    }

    const pinHash = await bcrypt.hash(pin, 12);

    await userRef.set({
      mobile,
      email: email.toLowerCase(),
      pinHash,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable