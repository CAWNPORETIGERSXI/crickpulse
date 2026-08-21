const admin = require("./firebase-admin");
const bcrypt = require("bcryptjs");

const db = admin.firestore();

module.exports = async (req, res) => {

  // ==========================================
  // ONLY POST REQUESTS
  // ==========================================

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {

    const {
      name,
      mobile,
      email,
      pin,
    } = req.body || {};


    // ==========================================
    // NAME / USERNAME VALIDATION
    // ==========================================

    const cleanName =
      String(name || "").trim();

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: "Please enter your name / username.",
      });
    }

    if (cleanName.length < 3) {
      return res.status(400).json({
        success: false,
        message:
          "Name / Username must contain at least 3 characters.",
      });
    }

    if (cleanName.length > 30) {
      return res.status(400).json({
        success: false,
        message:
          "Name / Username cannot be longer than 30 characters.",
      });
    }

    /*
      Allow:
      Letters
      Numbers
      Spaces
      Underscore
      Hyphen
      Dot
    */

    if (!/^[a-zA-Z0-9._\- ]+$/.test(cleanName)) {
      return res.status(400).json({
        success: false,
        message:
          "Name / Username contains invalid characters.",
      });
    }


    // ==========================================
    // MOBILE VALIDATION
    // ==========================================

    if (!/^[6-9]\d{9}$/.test(mobile || "")) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number.",
      });
    }


    // ==========================================
    // EMAIL VALIDATION
    // ==========================================

    const cleanEmail =
      String(email || "")
        .trim()
        .toLowerCase();

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanEmail
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address.",
      });
    }


    // ==========================================
    // PIN VALIDATION
    // ==========================================

    if (!/^\d{4}$/.test(pin || "")) {
      return res.status(400).json({
        success: false,
        message:
          "PIN must contain exactly 4 digits.",
      });
    }


    // ==========================================
    // USER DOCUMENT
    // ==========================================

    const userRef =
      db
        .collection("users")
        .doc(mobile);

    const existingUser =
      await userRef.get();


    // ==========================================
    // DUPLICATE MOBILE CHECK
    // ==========================================

    if (existingUser.exists) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this mobile number already exists.",
      });
    }


    // ==========================================
    // HASH PIN
    // ==========================================

    const pinHash =
      await bcrypt.hash(
        pin,
        12
      );


    // ==========================================
    // CREATE USER
    // ==========================================

    await userRef.set({

      /*
        Public profile name / username
      */

      name:
        cleanName,

      /*
        Account identity
      */

      mobile:
        mobile,

      email:
        cleanEmail,

      /*
        NEVER store plain PIN
      */

      pinHash:
        pinHash,

      /*
        Security fields
      */

      failedLoginAttempts:
        0,

      lockedUntil:
        null,

      lastLoginAt:
        null,

      /*
        Account creation
      */

      createdAt:
        admin.firestore.FieldValue
          .serverTimestamp(),

    });


    // ==========================================
    // SUCCESS
    // ==========================================

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