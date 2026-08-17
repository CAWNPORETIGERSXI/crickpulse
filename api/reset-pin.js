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
      newPin
    } = req.body || {};


    /* ================================
       VALIDATE MOBILE
    ================================= */

    if (!/^[6-9]\d{9}$/.test(mobile || "")) {

      return res.status(400).json({
        success: false,
        message: "Invalid mobile number.",
      });

    }


    /* ================================
       VALIDATE NEW PIN
    ================================= */

    if (!/^\d{4}$/.test(String(newPin || ""))) {

      return res.status(400).json({
        success: false,
        message: "PIN must contain exactly 4 digits.",
      });

    }


    /* ================================
       VALIDATE EMAIL
    ================================= */

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email || ""
      )
    ) {

      return res.status(400).json({
        success: false,
        message: "Invalid email address.",
      });

    }


    const normalizedEmail =
      email.trim().toLowerCase();


    /* ================================
       FIND USER
    ================================= */

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


    /* ================================
       CHECK EMAIL
    ================================= */

    if (
      !user.email ||
      user.email.toLowerCase() !== normalizedEmail
    ) {

      return res.status(401).json({
        success: false,
        message:
          "Mobile number and Gmail do not match.",
      });

    }


    /* ================================
       OTP VERIFICATION CHECK
    ================================= */

    if (user.otpVerified !== true) {

      return res.status(403).json({
        success: false,
        message:
          "OTP verification required.",
      });

    }


    /* ================================
       HASH NEW PIN
    ================================= */

    const pinHash =
      await bcrypt.hash(
        String(newPin),
        12
      );


    /* ================================
       UPDATE PIN
    ================================= */

    await userRef.update({

      pinHash: pinHash,

      otpVerified: false,

      resetOtp: null,

      resetOtpExpiresAt: null,

      failedLoginAttempts: 0,

      lockedUntil: null,

      pinUpdatedAt:
        admin.firestore.FieldValue
          .serverTimestamp(),

    });


    /* ================================
       SUCCESS
    ================================= */

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