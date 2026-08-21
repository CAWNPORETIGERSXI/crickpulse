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
      mobile,
      pin,
    } = req.body || {};


    // ==========================================
    // VALIDATE MOBILE
    // ==========================================

    if (!/^[6-9]\d{9}$/.test(mobile || "")) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number.",
      });
    }


    // ==========================================
    // VALIDATE PIN
    // ==========================================

    if (!/^\d{4}$/.test(pin || "")) {
      return res.status(400).json({
        success: false,
        message: "Invalid PIN.",
      });
    }


    // ==========================================
    // FIND USER
    // ==========================================

    const userRef =
      db
        .collection("users")
        .doc(mobile);

    const userSnap =
      await userRef.get();


    // ==========================================
    // USER NOT FOUND
    // ==========================================

    if (!userSnap.exists) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid mobile number or PIN.",
      });
    }


    const user =
      userSnap.data();


    // ==========================================
    // ACCOUNT LOCK CHECK
    // ==========================================

    if (
      user.lockedUntil &&
      user.lockedUntil.toMillis() >
        Date.now()
    ) {

      return res.status(429).json({
        success: false,
        message:
          "Too many failed attempts. Please try again later.",
      });

    }


    // ==========================================
    // CHECK PIN
    // ==========================================

    const pinCorrect =
      await bcrypt.compare(
        pin,
        user.pinHash
      );


    // ==========================================
    // WRONG PIN
    // ==========================================

    if (!pinCorrect) {

      const attempts =
        Number(
          user.failedLoginAttempts || 0
        ) + 1;


      // ----------------------------------------
      // LOCK AFTER 5 FAILED ATTEMPTS
      // ----------------------------------------

      if (attempts >= 5) {

        const lockedUntil =
          new Date(
            Date.now() +
            15 * 60 * 1000
          );


        await userRef.update({

          failedLoginAttempts:
            0,

          lockedUntil:
            lockedUntil,

        });


        return res.status(429).json({

          success: false,

          message:
            "Too many failed attempts. Account temporarily locked.",

        });

      }


      // ----------------------------------------
      // SAVE FAILED ATTEMPT
      // ----------------------------------------

      await userRef.update({

        failedLoginAttempts:
          attempts,

      });


      return res.status(401).json({

        success: false,

        message:
          "Invalid mobile number or PIN.",

      });

    }


    // ==========================================
    // SUCCESSFUL LOGIN
    // ==========================================

    await userRef.update({

      failedLoginAttempts:
        0,

      lockedUntil:
        null,

      lastLoginAt:
        admin.firestore.FieldValue
          .serverTimestamp(),

    });


    // ==========================================
    // RETURN USER PROFILE
    // ==========================================

    return res.status(200).json({

      success: true,

      message:
        "Login successful.",

      user: {

        /*
         * Registered Name / Username
         */

        name:
          user.name || "",

        /*
         * Mobile
         */

        mobile:
          user.mobile || mobile,

        /*
         * Email
         */

        email:
          user.email || "",

      },

    });


  } catch (error) {

    console.error(
      "LOGIN ERROR:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Unable to login.",

    });

  }

};