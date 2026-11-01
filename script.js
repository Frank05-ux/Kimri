
"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       KIMRI WEBSITE — MAIN JAVASCRIPT
       Kigumo Makomboki Recovery Initiative

       FEATURES:
       1. Responsive navigation
       2. Smooth scrolling
       3. Donate button navigation
       4. Active navigation highlighting
       5. Accessible gallery lightbox
       6. Gallery keyboard and touch navigation
       7. Feedback form submission
       8. Automatic copyright year
       9. Accessibility improvements
    ========================================================= */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        Array.from(parent.querySelectorAll(selector));

    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    /* =========================================================
       WEBSITE COLOR THEME
    ========================================================= */

    const themeToggle = $("#themeToggle");
    const themeColorMeta = $('meta[name="theme-color"]');
    const savedTheme = (() => {
        try {
            return window.localStorage.getItem("kimri-theme");
        } catch (error) {
            console.warn("KIMRI: Could not read the saved color theme.", error);
            return null;
        }
    })();

    function setTheme(theme) {

        const isDark = theme === "dark";
        const nextThemeName = isDark ? "light" : "dark";

        document.documentElement.dataset.theme = isDark ? "dark" : "light";

        if (themeColorMeta) {
            themeColorMeta.setAttribute(
                "content",
                isDark ? "#101812" : "#14532d"
            );
        }

        if (themeToggle) {
            themeToggle.setAttribute(
                "aria-label",
                `Switch to ${nextThemeName} theme`
            );
            themeToggle.setAttribute("title", `Switch to ${nextThemeName} theme`);
            themeToggle.setAttribute("aria-pressed", String(isDark));
            themeToggle.innerHTML = isDark
                ? '<i class="fa-solid fa-sun" aria-hidden="true"></i><span>Light mode</span>'
                : '<i class="fa-solid fa-moon" aria-hidden="true"></i><span>Dark mode</span>';
        }

    }

    setTheme(savedTheme === "dark" ? "dark" : "light");

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            const nextTheme =
                document.documentElement.dataset.theme === "dark"
                    ? "light"
                    : "dark";

            setTheme(nextTheme);

            try {
                window.localStorage.setItem("kimri-theme", nextTheme);
            } catch (error) {
                console.warn("KIMRI: Could not save the color theme preference.", error);
            }
        });
    }

    /* =========================================================
       INTERACTIVE LOCATION MAP
    ========================================================= */

    const mapElement = $("#locationMap");
    const mapLayerButtons = $$(".map-layer-toggle");
    const useMyLocationButton = $("#useMyLocation");
    const mapDirections = $("#mapDirections");
    const locationStatus = $("#locationStatus");

    if (mapElement) {

        if (!window.L) {

            console.error(
                "KIMRI: Leaflet could not be loaded; the location map is unavailable."
            );

        } else {

            mapElement.replaceChildren();

            const map = window.L.map(mapElement, {
                scrollWheelZoom: false
            }).setView([-0.8019678, 36.9620662], 12);

            const streetLayer = window.L.tileLayer(
                "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                {
                    maxZoom: 19,
                    attribution:
                        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
                }
            );

            const satelliteLayer = window.L.tileLayer(
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                {
                    maxZoom: 19,
                    attribution:
                        "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community"
                }
            );

            let visitorLocationMarker = null;

            streetLayer.addTo(map);

            window.L.marker([-0.8019678, 36.9620662])
                .addTo(map)
                .bindPopup(
                    "<strong>Kigumo town</strong><br>Regional reference point. Use the directions link for KAG Makomboki Church."
                );

            if (useMyLocationButton) {

                useMyLocationButton.addEventListener("click", () => {

                    if (
                        !navigator.geolocation ||
                        !window.isSecureContext
                    ) {

                        if (locationStatus) {
                            locationStatus.textContent =
                                window.isSecureContext
                                    ? "Location detection is not supported by this browser. You can still open directions and choose your starting point in Google Maps."
                                    : "Location detection requires a secure HTTPS website. You can still open directions and choose your starting point in Google Maps.";
                        }

                        return;

                    }

                    const directionsWindow = window.open("about:blank", "_blank");

                    if (directionsWindow) {
                        directionsWindow.document.title =
                            "Finding your location — KIMRI";
                        directionsWindow.document.body.textContent =
                            "Finding your location to prepare directions to KAG Makomboki Church…";
                    }

                    useMyLocationButton.disabled = true;
                    useMyLocationButton.setAttribute("aria-busy", "true");

                    if (locationStatus) {
                        locationStatus.textContent =
                            "Requesting your location. Allow location access in your browser when prompted.";
                    }

                    navigator.geolocation.getCurrentPosition(
                        (position) => {

                            const { latitude, longitude } =
                                position.coords;

                            const visitorLocation =
                                window.L.latLng(latitude, longitude);

                            if (visitorLocationMarker) {
                                map.removeLayer(visitorLocationMarker);
                            }

                            visitorLocationMarker = window.L.circleMarker(
                                visitorLocation,
                                {
                                    radius: 9,
                                    color: "#ffffff",
                                    weight: 3,
                                    fillColor: "#166534",
                                    fillOpacity: 1
                                }
                            )
                                .addTo(map)
                                .bindPopup("Your current location");

                            map.setView(visitorLocation, 16, {
                                animate: true
                            });
                            visitorLocationMarker.openPopup();

                            if (mapDirections) {

                                const directionsUrl =
                                    new URL(mapDirections.href);

                                directionsUrl.searchParams.set(
                                    "origin",
                                    `${latitude},${longitude}`
                                );

                                mapDirections.href =
                                    directionsUrl.toString();

                                if (directionsWindow) {
                                    directionsWindow.opener = null;
                                    directionsWindow.location.replace(
                                        directionsUrl.toString()
                                    );
                                } else if (locationStatus) {
                                    locationStatus.textContent =
                                        "Your location is shown on the map, but the browser blocked the directions tab. Select Get directions to continue.";
                                }

                            }

                            if (locationStatus && directionsWindow) {
                                locationStatus.textContent =
                                    "Your location is shown on the map. Opening directions to KAG Makomboki Church.";
                            }

                            useMyLocationButton.disabled = false;
                            useMyLocationButton.removeAttribute("aria-busy");

                        },
                        (error) => {

                            const messages = {
                                1: "Location access was denied. Allow it in your browser settings, or open directions and choose your starting point in Google Maps.",
                                2: "Your location is currently unavailable. Try again or choose your starting point in Google Maps.",
                                3: "Finding your location timed out. Please try again."
                            };

                            if (locationStatus) {
                                locationStatus.textContent =
                                    messages[error.code] ||
                                    "We could not detect your location. You can still choose your starting point in Google Maps.";
                            }

                            console.warn(
                                "KIMRI: Could not detect the visitor's location.",
                                error.message
                            );

                            if (directionsWindow && !directionsWindow.closed) {
                                directionsWindow.close();
                            }

                            useMyLocationButton.disabled = false;
                            useMyLocationButton.removeAttribute("aria-busy");

                        },
                        {
                            enableHighAccuracy: true,
                            timeout: 15000,
                            maximumAge: 60000
                        }
                    );

                });

            }

            mapLayerButtons.forEach((button) => {

                button.addEventListener("click", () => {

                    const isSatellite =
                        button.dataset.mapLayer === "satellite";

                    if (isSatellite) {
                        map.removeLayer(streetLayer);
                        satelliteLayer.addTo(map);
                    } else {
                        map.removeLayer(satelliteLayer);
                        streetLayer.addTo(map);
                    }

                    mapLayerButtons.forEach((layerButton) => {

                        const selected =
                            layerButton === button;

                        layerButton.classList.toggle(
                            "active",
                            selected
                        );

                        layerButton.setAttribute(
                            "aria-pressed",
                            String(selected)
                        );

                    });

                    map.invalidateSize();

                });

            });

        }

    }

    /* =========================================================
       1. RESPONSIVE NAVIGATION
    ========================================================= */

    const navToggle = $("#navToggle");
    const navMenu = $("#navmenu");

    const menuIcon = navToggle
        ? $("i", navToggle)
        : null;

    // Matches the desktop breakpoint in the stylesheet.
    const desktopNav = window.matchMedia("(min-width: 901px)");

    function isMenuOpen() {
        return Boolean(
            navMenu &&
            navMenu.classList.contains("active")
        );
    }

    function setMenu(open) {

        if (!navToggle || !navMenu) return;

        const shouldOpen = Boolean(open) && !desktopNav.matches;

        navMenu.classList.toggle("active", shouldOpen);

        navToggle.setAttribute(
            "aria-expanded",
            String(shouldOpen)
        );

        navToggle.setAttribute(
            "aria-label",
            shouldOpen
                ? "Close navigation menu"
                : "Open navigation menu"
        );

        if (menuIcon) {

            menuIcon.classList.toggle(
                "fa-xmark",
                shouldOpen
            );

            menuIcon.classList.toggle(
                "fa-bars",
                !shouldOpen
            );

        }
    }

    function closeMenu() {
        setMenu(false);
    }

    if (navToggle && navMenu) {

        navToggle.setAttribute(
            "aria-controls",
            navMenu.id || "navmenu"
        );

        navMenu.id = navMenu.id || "navmenu";

        navToggle.setAttribute(
            "aria-expanded",
            "false"
        );

        navToggle.setAttribute(
            "aria-label",
            "Open navigation menu"
        );

        navToggle.addEventListener("click", (event) => {

            event.stopPropagation();

            setMenu(!isMenuOpen());

        });

        // Close menu when a navigation link is selected.
        $$("a[href]", navMenu).forEach((link) => {

            link.addEventListener("click", () => {
                closeMenu();
            });

        });

        // Close menu when clicking outside.
        document.addEventListener("click", (event) => {

            if (
                isMenuOpen() &&
                !navMenu.contains(event.target) &&
                !navToggle.contains(event.target)
            ) {

                closeMenu();

            }

        });

        // Escape closes the mobile menu.
        document.addEventListener("keydown", (event) => {

            if (
                event.key === "Escape" &&
                isMenuOpen()
            ) {

                closeMenu();
                navToggle.focus();

            }

        });

        // Reset menu when changing between mobile and desktop.
        const handleBreakpointChange = () => {

            if (desktopNav.matches) {
                closeMenu();
            }

        };

        if (desktopNav.addEventListener) {

            desktopNav.addEventListener(
                "change",
                handleBreakpointChange
            );

        } else {

            desktopNav.addListener(
                handleBreakpointChange
            );

        }

    }

    /* =========================================================
       2. SMOOTH SCROLLING
    ========================================================= */

    function scrollToTarget(selector, updateHistory = true) {

        if (!selector || selector === "#") {
            return false;
        }

        let target;

        try {

            target = document.querySelector(selector);

        } catch (error) {

            console.warn(
                "KIMRI: Invalid navigation target.",
                selector
            );

            return false;

        }

        if (!target) {
            return false;
        }

        closeMenu();

        target.scrollIntoView({

            behavior: reduceMotion.matches
                ? "auto"
                : "smooth",

            block: "start"

        });

        if (updateHistory) {

            try {

                if (window.location.hash !== selector) {

                    history.replaceState(
                        null,
                        "",
                        selector
                    );

                }

            } catch (error) {

                console.warn(
                    "KIMRI: URL history could not be updated.",
                    error
                );

            }

        }

        return true;

    }

    $$('a[href^="#"]').forEach((link) => {

        link.addEventListener("click", (event) => {

            if (link.dataset.action === "donate") {
                return;
            }

            const selector = link.getAttribute("href");

            if (scrollToTarget(selector)) {
                event.preventDefault();
            }

        });

    });

    /* =========================================================
       3. DONATE BUTTONS
    ========================================================= */

    const donationButtons = new Set([

        ...$$("#donateNowBtn"),

        ...$$(".donate-button"),

        ...$$(".nav-donate-item"),

        ...$$('[data-action="donate"]')

    ]);

    const donationDialog = $("#donation-dialog");
    const donationDialogClose = donationDialog
        ? $(".donation-dialog-close", donationDialog)
        : null;
    let donationTrigger = null;

    function closeDonationDialog() {

        if (!donationDialog || donationDialog.hidden) {
            return;
        }

        donationDialog.hidden = true;
        donationDialog.setAttribute("aria-hidden", "true");
        document.body.classList.remove("donation-dialog-open");

        if (donationTrigger && donationTrigger.isConnected) {
            donationTrigger.focus();
        }

        donationTrigger = null;

    }

    function handleDonationClick(event) {

        const button = event.currentTarget;

        // Allow external payment links to work normally.
        if (
            button.tagName === "A" &&
            button.getAttribute("href") &&
            !button.getAttribute("href").startsWith("#")
        ) {
            return;
        }

        if (!donationDialog) {

            console.warn(
                "KIMRI: Donation information dialog is missing."
            );

            return;

        }

        event.preventDefault();
        closeMenu();
        donationTrigger = button;
        donationDialog.hidden = false;
        donationDialog.setAttribute("aria-hidden", "false");
        document.body.classList.add("donation-dialog-open");

        if (donationDialogClose) {
            donationDialogClose.focus();
        }

    }

    donationButtons.forEach((button) => {

        button.addEventListener(
            "click",
            handleDonationClick
        );

    });

    if (donationDialog && donationDialogClose) {

        donationDialogClose.addEventListener(
            "click",
            closeDonationDialog
        );

        donationDialog.addEventListener("click", (event) => {

            if (event.target === donationDialog) {
                closeDonationDialog();
            }

        });

        donationDialog.addEventListener("keydown", (event) => {

            if (event.key === "Escape") {
                event.preventDefault();
                closeDonationDialog();
                return;
            }

            if (event.key !== "Tab") {
                return;
            }

            const focusable = $$(
                "a[href], button:not(:disabled)",
                donationDialog
            ).filter((element) => element.getClientRects().length > 0);

            if (focusable.length === 0) {
                event.preventDefault();
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }

        });

    }

    /*
       The donation dialog provides contact information only.
       It does not collect or process payments.
    */

    /* =========================================================
       4. ACTIVE NAVIGATION HIGHLIGHTING
    ========================================================= */

    const sectionLinks = $$("#navmenu a.nav-link");

    const sectionMap = new Map();

    sectionLinks.forEach((link) => {

        const href = link.getAttribute("href") || "";

        if (
            !href.startsWith("#") ||
            href === "#"
        ) {
            return;
        }

        let section;

        try {

            section = $(href);

        } catch {

            return;

        }

        if (section) {
            sectionMap.set(section, link);
        }

    });

    function setActiveLink(activeLink) {

        sectionLinks.forEach((link) => {

            const active = link === activeLink;

            link.classList.toggle(
                "active",
                active
            );

            if (active) {

                link.setAttribute(
                    "aria-current",
                    "location"
                );

            } else {

                link.removeAttribute("aria-current");

            }

        });

    }

    if (
        "IntersectionObserver" in window &&
        sectionMap.size > 0
    ) {

        const sectionObserver = new IntersectionObserver(

            (entries) => {

                const visibleEntries = entries

                    .filter((entry) => entry.isIntersecting)

                    .sort(
                        (a, b) =>
                            a.boundingClientRect.top -
                            b.boundingClientRect.top
                    );

                if (visibleEntries.length > 0) {

                    const link = sectionMap.get(
                        visibleEntries[0].target
                    );

                    if (link) {
                        setActiveLink(link);
                    }

                }

            },

            {

                rootMargin: "-20% 0px -65% 0px",

                threshold: 0

            }

        );

        sectionMap.forEach((link, section) => {

            sectionObserver.observe(section);

        });

    }

    /* =========================================================
       5. GALLERY LIGHTBOX
    ========================================================= */

    const galleryImages = $$(".gallery img");

    const lightbox = $("#lightbox");

    const lightboxImg = lightbox
        ? $("#lightboxImg", lightbox)
        : null;

    const lightboxCaption = lightbox
        ? $(".caption", lightbox)
        : null;

    const closeBtn = lightbox
        ? $(".close", lightbox)
        : null;

    const prevBtn = lightbox
        ? $(".prev", lightbox)
        : null;

    const nextBtn = lightbox
        ? $(".next", lightbox)
        : null;

    let currentImageIndex = 0;

    let previousFocusedElement = null;

    function isLightboxOpen() {

        return Boolean(

            lightbox &&

            lightbox.getAttribute("aria-hidden") === "false"

        );

    }

    function wrapIndex(index) {

        const total = galleryImages.length;

        if (total === 0) {
            return 0;
        }

        return ((index % total) + total) % total;

    }

    function preloadImage(index) {

        if (galleryImages.length < 2) {
            return;
        }

        const image = galleryImages[wrapIndex(index)];

        if (!image) {
            return;
        }

        const preload = new Image();

        preload.src = image.currentSrc || image.src;

    }

    function showGalleryImage(index) {

        if (
            !lightbox ||
            !lightboxImg ||
            galleryImages.length === 0
        ) {
            return;
        }

        currentImageIndex = wrapIndex(index);

        const selectedImage =
            galleryImages[currentImageIndex];

        const imageSource =
            selectedImage.currentSrc ||
            selectedImage.src;

        const imageAlt =
            selectedImage.alt ||
            "KIMRI gallery photograph";

        const caption =
            selectedImage.dataset.caption ||
            selectedImage.alt ||
            "KIMRI community activity";

        lightboxImg.alt = imageAlt;

        if (lightboxCaption) {
            lightboxCaption.textContent = caption;
        }

        lightboxImg.src = imageSource;

        const hasMultipleImages =
            galleryImages.length > 1;

        if (prevBtn) {
            prevBtn.disabled = !hasMultipleImages;
        }

        if (nextBtn) {
            nextBtn.disabled = !hasMultipleImages;
        }

        preloadImage(currentImageIndex + 1);

        preloadImage(currentImageIndex - 1);

    }

    function openLightbox(index) {

        if (
            !lightbox ||
            !lightboxImg ||
            galleryImages.length === 0
        ) {
            return;
        }

        previousFocusedElement = document.activeElement;

        showGalleryImage(index);

        // Remove hidden attribute if it exists.
        lightbox.hidden = false;

        lightbox.classList.add("active");

        lightbox.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add("lightbox-open");

        if (closeBtn) {
            closeBtn.focus();
        }

    }

    function closeLightbox() {

        if (
            !lightbox ||
            !isLightboxOpen()
        ) {
            return;
        }

        lightbox.classList.remove("active");

        lightbox.setAttribute(
            "aria-hidden",
            "true"
        );

        lightbox.hidden = true;

        document.body.classList.remove("lightbox-open");

        if (lightboxImg) {
            lightboxImg.removeAttribute("src");
        }

        if (lightboxCaption) {
            lightboxCaption.textContent = "";
        }

        if (
            previousFocusedElement &&
            previousFocusedElement.isConnected &&
            typeof previousFocusedElement.focus === "function"
        ) {

            previousFocusedElement.focus();

        }

        previousFocusedElement = null;

    }

    function showNextImage() {

        showGalleryImage(
            currentImageIndex + 1
        );

    }

    function showPreviousImage() {

        showGalleryImage(
            currentImageIndex - 1
        );

    }

    // Make all gallery images accessible.
    galleryImages.forEach((image, index) => {

        const clickableParent = image.closest("a, button");

        if (!clickableParent) {

            if (!image.hasAttribute("tabindex")) {
                image.setAttribute("tabindex", "0");
            }

            image.setAttribute("role", "button");

            image.setAttribute(
                "aria-label",
                `Open image: ${image.alt || "KIMRI gallery photograph"}`
            );

        }

        image.addEventListener("click", (event) => {

            // Prevent an image inside an anchor from navigating away.
            if (image.closest("a")) {
                event.preventDefault();
            }

            openLightbox(index);

        });

        image.addEventListener("keydown", (event) => {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                if (!image.closest("a, button")) {

                    event.preventDefault();

                    openLightbox(index);

                }

            }

        });

    });

    // Also allow clicking the complete gallery card.
    $$(".gallery-item").forEach((item) => {

        item.addEventListener("click", (event) => {

            if (event.target.closest("a")) {
                return;
            }

            if (event.target.closest("img")) {
                return;
            }

            const image = $("img", item);

            const index = galleryImages.indexOf(image);

            if (index !== -1) {
                openLightbox(index);
            }

        });

    });

    if (closeBtn) {

        closeBtn.addEventListener(
            "click",
            closeLightbox
        );

    }

    if (prevBtn) {

        prevBtn.addEventListener(
            "click",
            showPreviousImage
        );

    }

    if (nextBtn) {

        nextBtn.addEventListener(
            "click",
            showNextImage
        );

    }

    if (lightboxImg) {

        lightboxImg.addEventListener("error", () => {

            if (
                isLightboxOpen() &&
                lightboxCaption
            ) {

                lightboxCaption.textContent =
                    "Sorry, this photograph could not be loaded.";

            }

        });

    }

    if (lightbox) {

        // Clicking the dark background closes the lightbox.
        lightbox.addEventListener("click", (event) => {

            if (event.target === lightbox) {
                closeLightbox();
            }

        });

        // Touchscreen swipe navigation.
        let touchStartX = null;

        let touchStartY = null;

        lightbox.addEventListener(

            "touchstart",

            (event) => {

                const touch = event.changedTouches[0];

                touchStartX = touch.clientX;

                touchStartY = touch.clientY;

            },

            { passive: true }

        );

        lightbox.addEventListener(

            "touchend",

            (event) => {

                if (
                    touchStartX === null ||
                    touchStartY === null
                ) {
                    return;
                }

                const touch = event.changedTouches[0];

                const deltaX =
                    touch.clientX - touchStartX;

                const deltaY =
                    touch.clientY - touchStartY;

                touchStartX = null;

                touchStartY = null;

                if (
                    Math.abs(deltaX) > 50 &&
                    Math.abs(deltaX) > Math.abs(deltaY)
                ) {

                    if (deltaX < 0) {
                        showNextImage();
                    } else {
                        showPreviousImage();
                    }

                }

            },

            { passive: true }

        );

        // Keep keyboard focus within the lightbox.
        lightbox.addEventListener("keydown", (event) => {

            if (
                event.key !== "Tab" ||
                !isLightboxOpen()
            ) {
                return;
            }

            const focusable = $$(
                "button:not(:disabled), [tabindex]:not([tabindex='-1'])",
                lightbox
            ).filter((element) => {

                return element.getClientRects().length > 0;

            });

            if (focusable.length === 0) {

                event.preventDefault();

                return;

            }

            const first = focusable[0];

            const last = focusable[focusable.length - 1];

            if (
                event.shiftKey &&
                document.activeElement === first
            ) {

                event.preventDefault();

                last.focus();

            } else if (
                !event.shiftKey &&
                document.activeElement === last
            ) {

                event.preventDefault();

                first.focus();

            }

        });

    }

    // Lightbox keyboard controls.
    document.addEventListener("keydown", (event) => {

        if (!isLightboxOpen()) {
            return;
        }

        if (event.key === "Escape") {

            event.preventDefault();

            closeLightbox();

        } else if (event.key === "ArrowRight") {

            event.preventDefault();

            showNextImage();

        } else if (event.key === "ArrowLeft") {

            event.preventDefault();

            showPreviousImage();

        }

    });

    // Ensure the lightbox starts closed.
    if (lightbox) {

        lightbox.setAttribute(
            "aria-hidden",
            "true"
        );

        lightbox.hidden = true;

        lightbox.classList.remove("active");

    }

    /* =========================================================
       6. FEEDBACK FORM
    ========================================================= */

    const feedbackForm = $("#feedbackForm");

    const feedbackStatus = $("#feedbackStatus");

    const feedbackSubmitBtn = feedbackForm
        ? $('[type="submit"]', feedbackForm)
        : null;

    const feedbackRatingInputs = feedbackForm
        ? $$('input[name="rating"]', feedbackForm)
        : [];
    const feedbackRatingText = $("#feedbackRatingText");

    const FEEDBACK_TIMEOUT_MS = 20000;

    let feedbackIsSubmitting = false;

    function updateFeedbackRating() {

        const selectedInput =
            $('input[name="rating"]:checked', feedbackForm);

        const selectedRating = selectedInput
            ? Number(selectedInput.value)
            : 0;

        $$(".star-rating label", feedbackForm).forEach((label) => {

            const rating = Number(label.dataset.rating);

            label.classList.toggle(
                "selected",
                rating <= selectedRating
            );

        });

        if (feedbackRatingText) {

            const descriptions = [
                "Select a star rating",
                "1 star — Poor",
                "2 stars — Fair",
                "3 stars — Good",
                "4 stars — Very good",
                "5 stars — Excellent"
            ];

            feedbackRatingText.textContent =
                descriptions[selectedRating] || descriptions[0];

        }

    }

    feedbackRatingInputs.forEach((input) => {
        input.addEventListener("change", updateFeedbackRating);
    });

    if (feedbackForm && feedbackRatingInputs.length > 0) {

        feedbackForm.addEventListener("reset", () => {
            window.setTimeout(updateFeedbackRating, 0);
        });

        updateFeedbackRating();

    }

    function clearFeedbackStatus() {

        if (!feedbackStatus) {
            return;
        }

        feedbackStatus.classList.remove(
            "info",
            "success",
            "error",
            "feedback-loading",
            "feedback-success",
            "feedback-error"
        );

        feedbackStatus.removeAttribute("data-status");

        feedbackStatus.textContent = "";

        feedbackStatus.setAttribute(
            "role",
            "status"
        );

        feedbackStatus.setAttribute(
            "aria-live",
            "polite"
        );

    }

    function showFeedbackStatus(type, message) {

        if (!feedbackStatus) {
            return;
        }

        clearFeedbackStatus();

        feedbackStatus.classList.add(type);

        feedbackStatus.setAttribute(
            "data-status",
            type
        );

        feedbackStatus.textContent = message;

        if (type === "error") {

            feedbackStatus.setAttribute(
                "role",
                "alert"
            );

            feedbackStatus.setAttribute(
                "aria-live",
                "assertive"
            );

        }

    }

    if (feedbackStatus) {

        feedbackStatus.setAttribute(
            "role",
            "status"
        );

        feedbackStatus.setAttribute(
            "aria-live",
            "polite"
        );

    }

    if (feedbackForm) {

        feedbackForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();

                if (feedbackIsSubmitting) {
                    return;
                }

                // Browser validation.
                if (!feedbackForm.checkValidity()) {

                    feedbackForm.reportValidity();

                    return;

                }

                const formAction = (
                    feedbackForm.getAttribute("action") || ""
                ).trim();

                if (!formAction) {

                    showFeedbackStatus(
                        "error",
                        "The feedback form is not configured. Please contact KIMRI directly."
                    );

                    console.error(
                        "KIMRI: Feedback form is missing its action attribute."
                    );

                    return;

                }

                let parsedAction;

                try {

                    parsedAction = new URL(
                        formAction,
                        window.location.href
                    );

                } catch {

                    showFeedbackStatus(
                        "error",
                        "The feedback form URL is invalid. Please contact KIMRI directly."
                    );

                    return;

                }

                if (
                    !["https:", "http:"].includes(
                        parsedAction.protocol
                    )
                ) {

                    showFeedbackStatus(
                        "error",
                        "The feedback form URL is invalid."
                    );

                    return;

                }

                feedbackIsSubmitting = true;

                const originalButtonHTML = feedbackSubmitBtn
                    ? feedbackSubmitBtn.innerHTML
                    : "";

                if (feedbackSubmitBtn) {

                    feedbackSubmitBtn.disabled = true;

                    feedbackSubmitBtn.setAttribute(
                        "aria-busy",
                        "true"
                    );

                    feedbackSubmitBtn.innerHTML =
                        '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Submitting...';

                }

                showFeedbackStatus(
                    "info",
                    "Your feedback is being submitted. Please wait..."
                );

                const controller = new AbortController();

                const timeoutId = window.setTimeout(
                    () => controller.abort(),
                    FEEDBACK_TIMEOUT_MS
                );

                try {

                    const response = await fetch(
                        parsedAction.href,
                        {
                            method: "POST",

                            body: new FormData(feedbackForm),

                            headers: {
                                Accept: "application/json"
                            },

                            signal: controller.signal
                        }
                    );

                    let responseData = {};

                    const contentType =
                        response.headers.get("content-type") || "";

                    if (
                        contentType.includes("application/json")
                    ) {

                        responseData = await response.json();

                    }

                    if (!response.ok) {

                        let errorMessage =
                            "We could not submit your feedback. Please try again.";

                        if (
                            Array.isArray(responseData.errors) &&
                            responseData.errors.length > 0
                        ) {

                            const details = responseData.errors
                                .map((item) => {

                                    return typeof item === "string"
                                        ? item
                                        : item.message || "";

                                })
                                .filter(Boolean)
                                .join(" ");

                            if (details) {
                                errorMessage = details;
                            }

                        } else if (responseData.message) {

                            errorMessage = responseData.message;

                        }

                        throw new Error(errorMessage);

                    }

                    if (responseData.success === false) {

                        throw new Error(
                            responseData.message ||
                            "Your feedback could not be accepted. Please try again."
                        );

                    }

                    showFeedbackStatus(
                        "success",
                        responseData.message ||
                        "Thank you for your feedback! Your submission has been received."
                    );

                    feedbackForm.reset();

                } catch (error) {

                    console.error(
                        "KIMRI feedback submission failed:",
                        error
                    );

                    let message =
                        "We could not send your feedback. Check your internet connection and try again.";

                    if (error.name === "AbortError") {

                        message =
                            "The request took too long. Please check your connection and try again.";

                    } else if (error instanceof TypeError) {

                        message =
                            "A network error occurred. Check your connection and make sure the feedback service is available.";

                    } else if (
                        error instanceof Error &&
                        error.message
                    ) {

                        message = error.message;

                    }

                    showFeedbackStatus(
                        "error",
                        message
                    );

                } finally {

                    window.clearTimeout(timeoutId);

                    feedbackIsSubmitting = false;

                    if (feedbackSubmitBtn) {

                        feedbackSubmitBtn.disabled = false;

                        feedbackSubmitBtn.removeAttribute(
                            "aria-busy"
                        );

                        feedbackSubmitBtn.innerHTML =
                            originalButtonHTML;

                    }

                }

            }
        );

        // Clear old messages when a visitor edits the form.
        ["input", "change"].forEach((eventName) => {

            feedbackForm.addEventListener(
                eventName,
                () => {

                    if (!feedbackIsSubmitting) {
                        clearFeedbackStatus();
                    }

                }
            );

        });

    }

    /* =========================================================
       7. AUTOMATIC COPYRIGHT YEAR
    ========================================================= */

    const currentYear = $("#currentYear");

    if (currentYear) {

        currentYear.textContent = String(
            new Date().getFullYear()
        );

    }

    /* =========================================================
       8. INITIAL PAGE STATE
    ========================================================= */

    // Always close the mobile menu after page initialization.
    if (navToggle && navMenu) {
        closeMenu();
    }

    // Remove stale lightbox state.
    document.body.classList.remove("lightbox-open");

    console.info(
        "KIMRI website initialized successfully."
    );

});
