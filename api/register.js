const admin = require("./firebase-admin");
const bcrypt = require("bcryptjs");

const db = admin.firestore();

module.exports = async (req, res) => {

  // Only POST requests allowed
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

    // -----------------------------
    // Validate mobile
    // -----------------------------

    if (!/^[6-9]\d{9}$/.test(mobile || "")) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number.",
      });
    }

    // -----------------------------
    // Validate email
    // -----------------------------

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "")) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address.",
      });
    }

    // -----------------------------
    // Validate PIN
    // -----------------------------

    if (!/^\d{4}$/.test(pin || "")) {
      return res.status(400).json({
        success: false,
        message: "PIN must contain exactly 4 digits.",
      });
    }

    // -----------------------------
    // Find user by mobile
    // -----------------------------

    const userRef = db
      .collection("users")
      .doc(mobile);

    const existingUser = await userRef.get();

    // -----------------------------
    // Prevent duplicate account
    // -----------------------------

    if (existingUser.exists) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this mobile number already exists.",
      });
    }

    // -----------------------------
    // Hash PIN
    // -----------------------------

    const pinHash = await bcrypt.hash(
      pin,
      12
    );

    // -----------------------------
    // Create user
    // -----------------------------

    await userRef.set({

      mobile,

      email:
        email.toLowerCase(),

      pinHash,

      createdAt:
        admin.firestore.FieldValue.serverTimestamp(),

      failedLoginAttempts: 0,

      lockedUntil: null,

      lastLoginAt: null,

    });

    // -----------------------------
    // Success
    // -----------------------------

    return res.status(201).json({

      success: true,

      message:
        "Account created successfully.",

    });

  } catch (error) {

    console.error(
      "REGISTER ERROR:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Unable to create account.",

    });

  }

};