// ==========================================
// CRICKPULSE
// MAIN WEBSITE JAVASCRIPT
// ==========================================


// ==========================================
// MOBILE MENU
// ==========================================

const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");


if (menuBtn && mobileMenu) {

    menuBtn.addEventListener("click", function () {

        mobileMenu.classList.toggle("active");


        if (mobileMenu.classList.contains("active")) {

            menuBtn.textContent = "✕";

            menuBtn.setAttribute(
                "aria-label",
                "Close menu"
            );

        } else {

            menuBtn.textContent = "☰";

            menuBtn.setAttribute(
                "aria-label",
                "Open menu"
            );

        }

    });

}


// ==========================================
// CLOSE MOBILE MENU AFTER CLICK
// ==========================================

const mobileLinks =
    document.querySelectorAll(".mobile-menu a");


mobileLinks.forEach(function (link) {

    link.addEventListener("click", function () {

        if (mobileMenu) {

            mobileMenu.classList.remove("active");

        }


        if (menuBtn) {

            menuBtn.textContent = "☰";

            menuBtn.setAttribute(
                "aria-label",
                "Open menu"
            );

        }

    });

});


// ==========================================
// CLOSE MENU WHEN CLICKING OUTSIDE
// ==========================================

document.addEventListener("click", function (event) {

    if (!menuBtn || !mobileMenu) {
        return;
    }


    const clickedInsideMenu =
        mobileMenu.contains(event.target);


    const clickedMenuButton =
        menuBtn.contains(event.target);


    if (
        mobileMenu.classList.contains("active") &&
        !clickedInsideMenu &&
        !clickedMenuButton
    ) {

        mobileMenu.classList.remove("active");

        menuBtn.textContent = "☰";

        menuBtn.setAttribute(
            "aria-label",
            "Open menu"
        );

    }

});


// ==========================================
// CURRENT YEAR
// ==========================================

const currentYear =
    new Date().getFullYear();


const footerCopy =
    document.querySelector(".footer-copy");


if (footerCopy) {

    footerCopy.textContent =
        "© " +
        currentYear +
        " CRICKPULSE. All rights reserved.";

}


// ==========================================
// CRICKPULSE LOADED
// ==========================================

console.log(
    "CRICKPULSE — Phase 1 loaded successfully."
);