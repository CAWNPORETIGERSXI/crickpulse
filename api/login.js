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
    // FIREBASE AUTH UID
    // ==========================================

    let firebaseUser;


    /*
     * If this user already has a Firebase Auth
     * UID saved in Firestore, use it.
     *
     * Otherwise create a Firebase Auth user.
     */

    if (user.firebaseUid) {

      try {

        firebaseUser =
          await admin.auth()
            .getUser(
              user.firebaseUid
            );

      }
      catch (authError) {

        console.log(
          "Saved Firebase UID not found. Creating a new Auth user."
        );

        firebaseUser = null;

      }

    }


    // ==========================================
    // CREATE FIREBASE AUTH USER IF REQUIRED
    // ==========================================

    if (!firebaseUser) {

      try {

        firebaseUser =
          await admin.auth()
            .createUser({

              /*
               * Mobile is used as an internal
               * unique Firebase Auth identity.
               *
               * We are NOT using Firebase Phone Auth.
               */

              uid:
                `cp_${mobile}`,

              displayName:
                user.name || "",

            });

      }
      catch (createError) {

        /*
         * If the UID already exists in Firebase
         * Auth, retrieve it.
         */

        if (
          createError.code ===
          "auth/uid-already-exists"
        ) {

          firebaseUser =
            await admin.auth()
              .getUser(
                `cp_${mobile}`
              );

        }
        else {

          throw createError;

        }

      }

    }


    // ==========================================
    // SAVE FIREBASE UID
    // ==========================================

    if (
      user.firebaseUid !==
      firebaseUser.uid
    ) {

      await userRef.update({

        firebaseUid:
          firebaseUser.uid,

      });

    }


    // ==========================================
    // CREATE CUSTOM TOKEN
    // ==========================================

    const customToken =
      await admin.auth()
        .createCustomToken(
          firebaseUser.uid
        );


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
    // RETURN LOGIN DATA
    // ==========================================

    return res.status(200).json({

      success: true,

      message:
        "Login successful.",

      token:
        customToken,

      user: {

        name:
          user.name || "",

        mobile:
          user.mobile || mobile,

        email:
          user.email || "",

        firebaseUid:
          firebaseUser.uid,

      },

    });


  }
  catch (error) {

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