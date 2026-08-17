const admin = require("./firebase-admin");

const db = admin.firestore();

module.exports = async (req, res) => {

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {

    const { mobile, otp } = req.body || {};

    // Validate mobile
    if (!/^[6-9]\d{9}$/.test(mobile || "")) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number.",
      });
    }

    // Validate OTP
    if (!/^\d{6}$/.test(String(otp || ""))) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
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

    // Check OTP exists
    if (!user.resetOtp || !user.resetOtpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: "No OTP request found.",
      });
    }

    // Check expiry
    const expiresAt =
      user.resetOtpExpiresAt.toDate
        ? user.resetOtpExpiresAt.toDate()
        : new Date(user.resetOtpExpiresAt);

    if (expiresAt.getTime() < Date.now()) {

      await userRef.update({
        resetOtp: null,
        resetOtpExpiresAt: null,
      });

      return res.status(400).json({
        success: false,
        message: "OTP has expired.",
      });
    }

    // Check OTP
    if (String(user.resetOtp) !== String(otp)) {
      return res.status(401).json({
        success: false,
        message: "Incorrect OTP.",
      });
    }

    // OTP verified
    await userRef.update({
      resetOtp: null,
      resetOtpExpiresAt: null,
      otpVerified: true,
    });

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
    });

  } catch (error) {

    console.error(
      "VERIFY OTP ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to verify OTP.",
    });
  }
};