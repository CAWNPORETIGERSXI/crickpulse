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

    if (!/^[6-9]\d{9}$/.test(mobile || "")) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number.",
      });
    }

    if (!/^\d{4}$/.test(pin || "")) {
      return res.status(400).json({
        success: false,
        message: "Invalid PIN.",
      });
    }

    const userRef = db.collection("users").doc(mobile);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(401).json({
        success: false,
        message: "Invalid mobile number or PIN.",
      });
    }

    const user = userSnap.data();

    // Account lock check
    if (
      user.lockedUntil &&
      user.lockedUntil.toMillis() > Date.now()
    ) {
      return res.status(429).json({
        success: false,
        message: "Too many failed attempts. Please try again later.",
      });
    }

    const pinCorrect = await bcrypt.compare(
      pin,
      user.pinHash
    );

    if (!pinCorrect) {
      const attempts =
        Number(user.failedLoginAttempts || 0) + 1;

      if (attempts >= 5) {
        const lockedUntil = new Date(
          Date.now() + 15 * 60 * 1000
        );

        await userRef.update({
          failedLoginAttempts: 0,
          lockedUntil,
        });

        return res.status(429).json({
          success: false,
          message:
            "Too many failed attempts. Account temporarily locked.",
        });
      }

      await userRef.update({
        failedLoginAttempts: attempts,
      });

      return res.status(401).json({
        success: false,
        message: "Invalid mobile number or PIN.",
      });
    }

    // Successful login
    await userRef.update({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt:
        admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      user: {
        mobile: user.mobile,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to login.",
    });
  }
};