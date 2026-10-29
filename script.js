
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    /* =========================================================
       KIMRI WEBSITE — MAIN JAVASCRIPT
       Kigumo Makomboki Recovery Initiative
       Features:
       - Responsive navigation
       - Smooth scrolling
       - Donate button navigation
       - Active navigation links
       - Accessible gallery lightbox
       - Feedback form submission
       - Automatic copyright year
       ========================================================= */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        Array.from(parent.querySelectorAll(selector));

    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    /* =========================================================
       1. RESPONSIVE NAVIGATION
       ========================================================= */

    const navToggle = $("#navToggle");
    const navMenu = $("#navmenu");
    const menuIcon = navToggle ? $("i", navToggle) : null;

    // Keep this breakpoint consistent with the CSS navigation rules.
    const desktopNav = window.matchMedia("(min-width: 56rem)");

    function isMenuOpen() {
        return Boolean(
            navMenu && navMenu.classList.contains("active")
        );
    }

    function setMenu(open) {
        if (!navToggle || !navMenu) return;

        // Never leave the mobile menu open on desktop.
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
            menuIcon.classList.toggle("fa-xmark", shouldOpen);
            menuIcon.classList.toggle("fa-bars", !shouldOpen);
        }
    }

    function closeMenu() {
        setMenu(false);
    }

    if (navToggle && navMenu) {
        // Ensure the initial accessibility state is correct.
        navToggle.setAttribute("aria-controls", "navmenu");

        if (!navToggle.hasAttribute("aria-expanded")) {
            navToggle.setAttribute("aria-expanded", "false");
        }

        navToggle.addEventListener("click", (event) => {
            event.stopPropagation();
            setMenu(!isMenuOpen());
        });

        // Close after selecting a navigation item.
        $$("a[href]", navMenu).forEach((link) => {
            link.addEventListener("click", closeMenu);
        });

        // Close when clicking outside the navigation.
        document.addEventListener("click", (event) => {
            if (
                isMenuOpen() &&
                !navMenu.contains(event.target) &&
                !navToggle.contains(event.target)
            ) {
                closeMenu();
            }
        });

        // Close with Escape and return focus to the toggle.
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && isMenuOpen()) {
                closeMenu();
                navToggle.focus();
            }
        });

        // Reset navigation when the viewport changes.
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
            // Compatibility with older Safari.
            desktopNav.addListener(handleBreakpointChange);
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
        } catch {
            return false;
        }

        if (!target) {
            return false;
        }

        closeMenu();

        target.scrollIntoView({
            behavior: reduceMotion.matches ? "auto" : "smooth",
            block: "start"
        });

        if (updateHistory) {
            try {
                if (window.location.hash !== selector) {
                    history.replaceState(null, "", selector);
                }
            } catch (error) {
                // Scrolling should still work if history cannot update.
                console.warn("KIMRI: Could not update URL hash.", error);
            }
        }

        return true;
    }

    $$('a[href^="#"]').forEach((link) => {
        link.addEventListener("click", (event) => {
            const selector = link.getAttribute("href");

            if (scrollToTarget(selector)) {
                event.preventDefault();
            }
        });
    });

    /* =========================================================
       3. DONATE NOW BUTTONS
       ========================================================= */

    function handleDonationClick(event) {
        // Prefer a dedicated donation section when it exists.
        const donationTarget =
            $("#donation") ||
            $("#donate") ||
            $("#contact");

        if (!donationTarget) {
            // Do not silently swallow the click if no target exists.
            return;
        }

        event.preventDefault();

        scrollToTarget("#" + donationTarget.id);
    }

    const donationButtons = new Set([
        ...$$("#donateNowBtn"),
        ...$$(".donate-button"),
        ...$$(".nav-donate-item"),
        ...$$('[data-action="donate"]')
    ]);

    donationButtons.forEach((button) => {
        // Avoid intercepting ordinary links to an external payment page.
        if (
            button.tagName === "A" &&
            button.getAttribute("href") &&
            !button.getAttribute("href").startsWith("#")
        ) {
            return;
        }

        button.addEventListener("click", handleDonationClick);
    });

    /*
     * PAYMENT NOTICE:
     * This section only navigates to a page section.
     * It does not collect money, initiate M-Pesa STK Push,
     * or verify payments.
     *
     * Actual donations require a verified payment method,
     * provider configuration and server-side payment verification.
     */

    /* =========================================================
       4. ACTIVE NAVIGATION HIGHLIGHTING
       ========================================================= */

    const sectionLinks = $$("#navmenu a.nav-link");
    const sectionMap = new Map();

    sectionLinks.forEach((link) => {
        const href = link.getAttribute("href") || "";

        if (!href.startsWith("#") || href === "#") {
            return;
        }

        const section = $(href);

        if (section) {
            sectionMap.set(section, link);
        }
    });

    function setActiveLink(activeLink) {
        sectionLinks.forEach((link) => {
            const active = link === activeLink;

            link.classList.toggle("is-active", active);

            if (active) {
                link.setAttribute("aria-current", "location");
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
                // Prefer the intersecting section closest to the top.
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

    const lightboxImg = $("#lightboxImg", lightbox || document);
    const lightboxCaption = $(".caption", lightbox || document);
    const closeBtn = $(".close", lightbox || document);
    const prevBtn = $(".prev", lightbox || document);
    const nextBtn = $(".next", lightbox || document);

    let currentImageIndex = 0;
    let previousFocusedElement = null;

    function isLightboxOpen() {
        return Boolean(
            lightbox &&
            (
                lightbox.getAttribute("aria-hidden") === "false" ||
                lightbox.classList.contains("active")
            )
        );
    }

    function wrapIndex(index) {
        const total = galleryImages.length;

        if (total === 0) return 0;

        return ((index % total) + total) % total;
    }

    function preloadImage(index) {
        if (galleryImages.length < 2) return;

        const image = galleryImages[wrapIndex(index)];

        if (!image) return;

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

        const selectedImage = galleryImages[currentImageIndex];
        const imageSource =
            selectedImage.currentSrc || selectedImage.src;

        lightboxImg.alt =
            selectedImage.alt || "KIMRI gallery photograph";

        if (lightboxCaption) {
            lightboxCaption.textContent = lightboxImg.alt;
        }

        // Update the source only when necessary.
        if (lightboxImg.src !== imageSource) {
            lightboxImg.src = imageSource;
        }

        const hasMultipleImages = galleryImages.length > 1;

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

        lightbox.classList.add("active");
        lightbox.setAttribute("aria-hidden", "false");

        document.body.classList.add("lightbox-open");

        if (closeBtn) {
            closeBtn.focus();
        }
    }

    function closeLightbox() {
        if (!lightbox || !isLightboxOpen()) {
            return;
        }

        lightbox.classList.remove("active");
        lightbox.setAttribute("aria-hidden", "true");

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
        showGalleryImage(currentImageIndex + 1);
    }

    function showPreviousImage() {
        showGalleryImage(currentImageIndex - 1);
    }

    galleryImages.forEach((image, index) => {
        // Make gallery images keyboard-accessible.
        if (
            !image.hasAttribute("tabindex") &&
            !image.closest("a, button")
        ) {
            image.setAttribute("tabindex", "0");
        }

        image.addEventListener("click", () => {
            openLightbox(index);
        });

        image.addEventListener("keydown", (event) => {
            if (
                event.key === "Enter" ||
                event.key === " "
            ) {
                event.preventDefault();
                openLightbox(index);
            }
        });
    });

    if (closeBtn) {
        closeBtn.addEventListener("click", closeLightbox);
    }

    if (prevBtn) {
        prevBtn.addEventListener("click", showPreviousImage);
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", showNextImage);
    }

    if (lightboxImg) {
        lightboxImg.addEventListener("error", () => {
            if (isLightboxOpen() && lightboxCaption) {
                lightboxCaption.textContent =
                    "Sorry, this photograph could not be loaded.";
            }
        });
    }

    if (lightbox) {
        // Close only when the backdrop itself is clicked.
        lightbox.addEventListener("click", (event) => {
            if (event.target === lightbox) {
                closeLightbox();
            }
        });

        // Swipe navigation for touchscreens.
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
                if (touchStartX === null || touchStartY === null) {
                    return;
                }

                const touch = event.changedTouches[0];

                const deltaX = touch.clientX - touchStartX;
                const deltaY = touch.clientY - touchStartY;

                touchStartX = null;
                touchStartY = null;

                // Ignore mostly vertical gestures.
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
            if (event.key !== "Tab" || !isLightboxOpen()) {
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
        if (!isLightboxOpen()) return;

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

    /* =========================================================
       6. FEEDBACK FORM
       ========================================================= */

    const feedbackForm = $("#feedbackForm");
    const feedbackStatus = $("#feedbackStatus");

    const feedbackSubmitBtn = feedbackForm
        ? $('[type="submit"]', feedbackForm)
        : null;

    const FEEDBACK_TIMEOUT_MS = 20000;

    let feedbackIsSubmitting = false;

    function clearFeedbackStatus() {
        if (!feedbackStatus) return;

        feedbackStatus.classList.remove(
            "info",
            "success",
            "error"
        );

        feedbackStatus.removeAttribute("data-status");
        feedbackStatus.textContent = "";
        feedbackStatus.setAttribute("role", "status");
        feedbackStatus.setAttribute("aria-live", "polite");
    }

    function showFeedbackStatus(type, message) {
        if (!feedbackStatus) return;

        clearFeedbackStatus();

        feedbackStatus.classList.add(type);
        feedbackStatus.setAttribute("data-status", type);
        feedbackStatus.textContent = message;

        if (type === "error") {
            feedbackStatus.setAttribute("role", "alert");
        }
    }

    if (feedbackStatus) {
        feedbackStatus.setAttribute("role", "status");
        feedbackStatus.setAttribute("aria-live", "polite");
    }

    if (feedbackForm) {
        feedbackForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            if (feedbackIsSubmitting) return;

            if (!feedbackForm.checkValidity()) {
                feedbackForm.reportValidity();
                return;
            }

            const formAction = feedbackForm
                .getAttribute("action")
                ?.trim();

            if (!formAction) {
                showFeedbackStatus(
                    "error",
                    "The feedback form is not configured. Please contact KIMRI directly."
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
                !["https:", "http:"].includes(parsedAction.protocol)
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
                feedbackSubmitBtn.setAttribute("aria-busy", "true");

                feedbackSubmitBtn.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Submitting...';
            }

            showFeedbackStatus(
                "info",
                "Your feedback is being submitted. Please wait..."
            );

            const controller = new AbortController();

            const timeoutId = window.setTimeout(() => {
                controller.abort();
            }, FEEDBACK_TIMEOUT_MS);

            try {
                const response = await fetch(parsedAction.href, {
                    method: "POST",
                    body: new FormData(feedbackForm),
                    headers: {
                        Accept: "application/json"
                    },
                    signal: controller.signal
                });

                let responseData = {};

                try {
                    responseData = await response.json();
                } catch {
                    // A non-JSON response is handled below.
                }

                if (!response.ok) {
                    let message =
                        "We could not submit your feedback. Please try again.";

                    if (
                        Array.isArray(responseData.errors) &&
                        responseData.errors.length > 0
                    ) {
                        const details = responseData.errors
                            .map((item) => item.message || "")
                            .filter(Boolean)
                            .join(" ");

                        if (details) {
                            message = details;
                        }
                    }

                    throw new Error(message);
                }

                showFeedbackStatus(
                    "success",
                    "Thank you for your feedback! The service accepted your submission."
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
                } else if (
                    error instanceof TypeError
                ) {
                    message =
                        "A network error occurred. Check your connection and make sure the feedback service is available.";
                } else if (
                    error instanceof Error &&
                    error.message
                ) {
                    message = error.message;
                }

                showFeedbackStatus("error", message);

            } finally {
                window.clearTimeout(timeoutId);

                feedbackIsSubmitting = false;

                if (feedbackSubmitBtn) {
                    feedbackSubmitBtn.disabled = false;
                    feedbackSubmitBtn.removeAttribute("aria-busy");
                    feedbackSubmitBtn.innerHTML = originalButtonHTML;
                }
            }
        });

        // Remove stale feedback messages when the visitor edits fields.
        ["input", "change"].forEach((eventName) => {
            feedbackForm.addEventListener(eventName, () => {
                if (!feedbackIsSubmitting) {
                    clearFeedbackStatus();
                }
            });
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

    // Prevent a stale mobile menu state after page restoration.
    if (navToggle && navMenu && desktopNav.matches) {
        closeMenu();
    }

    // Start with the lightbox hidden if it exists.
    if (lightbox) {
        lightbox.setAttribute("aria-hidden", "true");
        lightbox.classList.remove("active");
    }
});
