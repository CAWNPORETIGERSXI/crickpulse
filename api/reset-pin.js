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

    const { mobile, pin } = req.body || {};

    // Validate mobile
    if (!/^[6-9]\d{9}$/.test(mobile || "")) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number.",
      });
    }

    // Validate PIN
    if (!/^\d{4}$/.test(String(pin || ""))) {
      return res.status(400).json({
        success: false,
        message: "PIN must contain exactly 4 digits.",
      });
    }

    // Find user
    const userRef =
      db.collection("users").doc(mobile);

    const userSnap =
      await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    const user =
      userSnap.data();

    // OTP verification check
    if (user.otpVerified !== true) {
      return res.status(403).json({
        success: false,
        message: "OTP verification required.",
      });
    }

    // Hash new PIN
    const pinHash =
      await bcrypt.hash(pin, 12);

    // Update PIN
    await userRef.update({

      pinHash,

      otpVerified: false,

      resetOtp: null,

      resetOtpExpiresAt: null,

      failedLoginAttempts: 0,

      lockedUntil: null,

      pinUpdatedAt:
        admin.firestore.FieldValue.serverTimestamp(),

    });

    return res.status(200).json({

      success: true,

      message:
        "PIN reset successfully.",

    });

  } catch (error) {

    console.error(
      "RESET PIN ERROR:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Unable to reset PIN.",

    });

  }

};