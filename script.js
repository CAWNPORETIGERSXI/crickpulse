// =========================================
// CRICKPULSE - MAIN JAVASCRIPT
// =========================================


// =========================================
// MOBILE MENU
// =========================================

const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");

if (menuBtn && mobileMenu) {

    menuBtn.addEventListener("click", function () {

        mobileMenu.classList.toggle("active");

        if (mobileMenu.classList.contains("active")) {
            menuBtn.innerHTML = "✕";
        } else {
            menuBtn.innerHTML = "☰";
        }

    });

}


// =========================================
// CLOSE MOBILE MENU
// =========================================

const menuLinks =
    document.querySelectorAll(".mobile-menu a");

menuLinks.forEach(function (link) {

    link.addEventListener("click", function () {

        if (mobileMenu) {
            mobileMenu.classList.remove("active");
        }

        if (menuBtn) {
            menuBtn.innerHTML = "☰";
        }

    });

});


// =========================================
// CREATE ACCOUNT BUTTON
// =========================================

const createAccountBtn =
    document.getElementById("createAccountBtn");

if (createAccountBtn) {

    createAccountBtn.addEventListener(
        "click",
        function () {

            window.location.href = "auth.html";

        }
    );

}


// =========================================
// CRICKPULSE LOADED
// =========================================

console.log(
    "CRICKPULSE loaded successfully."
);