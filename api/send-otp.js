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

    const { mobile, email } = req.body || {};

    // Validate mobile
    if (!/^[6-9]\d{9}$/.test(mobile || "")) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number.",
      });
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "")) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address.",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

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

    // Check mobile + email match
    if (
      !user.email ||
      user.email.toLowerCase() !== normalizedEmail
    ) {
      return res.status(401).json({
        success: false,
        message: "Mobile number and Gmail do not match.",
      });
    }

    // Generate 6 digit OTP
    const otp =
      Math.floor(100000 + Math.random() * 900000)
        .toString();

    // OTP expires after 10 minutes
    const expiresAt =
      new Date(Date.now() + 10 * 60 * 1000);

    // Store OTP
    await userRef.update({
      resetOtp: otp,
      resetOtpExpiresAt: expiresAt,
    });

    // Resend API key
    const apiKey =
      process.env.RESEND_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "Email service is not configured.",
      });
    }

    // Send email
    const response =
      await fetch(
        "https://api.resend.com/emails",
        {
          method: "POST",

          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },

          body: JSON.stringify({

            from:
              "CRICKPULSE <onboarding@resend.dev>",

            to: [normalizedEmail],

            subject:
              "CRICKPULSE - Password Reset OTP",

            html: `
              <div style="
                font-family:Arial,sans-serif;
                background:#050505;
                padding:30px;
                color:#ffffff;
              ">

                <div style="
                  max-width:500px;
                  margin:auto;
                  background:#101010;
                  padding:30px;
                  border-radius:15px;
                  border:1px solid #ff8800;
                  text-align:center;
                ">

                  <h1 style="color:#ff8800;">
                    CRICKPULSE
                  </h1>

                  <p>
                    Your OTP for resetting your PIN is:
                  </p>

                  <div style="
                    font-size:32px;
                    font-weight:bold;
                    letter-spacing:8px;
                    color:#ff8800;
                    margin:25px 0;
                  ">
                    ${otp}
                  </div>

                  <p style="color:#aaa;">
                    This OTP is valid for 10 minutes.
                  </p>

                  <p style="
                    color:#777;
                    font-size:12px;
                    margin-top:25px;
                  ">
                    If you did not request this,
                    please ignore this email.
                  </p>

                </div>
              </div>
            `,
          }),
        }
      );

    const data =
      await response.json();

    if (!response.ok) {

      console.error(
        "RESEND ERROR:",
        data
      );

      return res.status(500).json({
        success: false,
        message:
          data?.message ||
          "Unable to send OTP.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully.",
    });

  } catch (error) {

    console.error(
      "SEND OTP ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while sending OTP.",
    });
  }
};