/* ================================================================
   TECH HUB — app.js
   Scroll reveal · Skill bars · Cart toast · Theme toggle
   3D Tilt · Magnetic buttons · Micro-interactions
   ================================================================ */

(function () {
  "use strict";

  // ================================================================
  // SCROLL REVEAL — direction-aware + grid stagger
  // ================================================================
  const revealEls = document.querySelectorAll(".reveal");

  // Auto-assign directional slide based on horizontal position in viewport
  revealEls.forEach((el) => {
    if (el.dataset.reveal) return; // respect explicit data-reveal attribute
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const vw = window.innerWidth;
    if (cx < vw * 0.33) el.dataset.reveal = "left";
    else if (cx > vw * 0.67) el.dataset.reveal = "right";
    // else: default translateY slide-up from CSS
  });

  // Auto-stagger children inside grids
  document
    .querySelectorAll(
      ".shop-grid, .services-grid, .skills-layout, .footer__top",
    )
    .forEach((grid) => {
      [...grid.children].forEach((child, i) => {
        if (child.classList.contains("reveal")) {
          child.style.setProperty("--delay", `${i * 0.1}s`);
        }
      });
    });

  const revealObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          revealObserver.unobserve(entry.target);
        }
      }),
    { threshold: 0.08, rootMargin: "0px 0px -50px 0px" },
  );

  revealEls.forEach((el) => revealObserver.observe(el));

  // ================================================================
  // SKILL BAR ANIMATION
  // ================================================================
  const barFills = document.querySelectorAll(".bar-fill");

  const barObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.transform = `scaleX(${entry.target.dataset.w})`;
          barObserver.unobserve(entry.target);
        }
      }),
    { threshold: 0.5 },
  );

  barFills.forEach((bar) => barObserver.observe(bar));

  // ================================================================
  // TOAST NOTIFICATION
  // ================================================================
  const toastEl = document.getElementById("toast");
  let toastTimer = null;

  function showToast(message) {
    if (!toastEl) return;
    clearTimeout(toastTimer);
    toastEl.textContent = message;
    toastEl.classList.add("show");
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3000);
  }

  // ================================================================
  // ADD TO CART
  // ================================================================
  window.addToCart = function (btn, productName) {
    btn.disabled = true;
    btn.textContent = "✓ Added";
    showToast(`${productName} added to enquiry!`);
    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = `Buy Now <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`;
    }, 2500);
  };

  // ================================================================
  // STICKY NAV SHADOW
  // ================================================================
  const navWrap = document.querySelector(".nav-wrap");
  if (navWrap) {
    window.addEventListener(
      "scroll",
      () => {
        const dark =
          document.documentElement.getAttribute("data-theme") === "dark";
        navWrap.style.boxShadow =
          window.scrollY > 10
            ? dark
              ? "0 4px 24px rgba(0,0,0,0.40)"
              : "0 4px 16px rgba(0,0,0,0.09)"
            : "none";
      },
      { passive: true },
    );
  }

  // ================================================================
  // THEME TOGGLE
  // ================================================================
  const STORAGE_KEY = "techhub-theme";
  const toggleBtn = document.getElementById("themeToggle");
  const htmlEl = document.documentElement;

  function applyTheme(theme) {
    htmlEl.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
    if (toggleBtn) {
      toggleBtn.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
      );
    }
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      applyTheme(
        htmlEl.getAttribute("data-theme") === "dark" ? "light" : "dark",
      );
    });
    const cur = htmlEl.getAttribute("data-theme") || "dark";
    toggleBtn.setAttribute(
      "aria-label",
      cur === "dark" ? "Switch to light mode" : "Switch to dark mode",
    );
  }

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      if (!localStorage.getItem(STORAGE_KEY))
        applyTheme(e.matches ? "dark" : "light");
    });

  // ================================================================
  // 3D TILT EFFECT — product cards only, fine-pointer devices
  // ================================================================
  function initTilt() {
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const cards = document.querySelectorAll(".product-card");
    const MAX_TILT = 10; // max rotation in degrees
    const PERSPECTIVE = 900; // px — lower = more dramatic

    // Transitions used during tilt (fast, no spring — needs to track cursor)
    const T_TRACKING =
      "box-shadow 0.3s ease, border-color 0.2s ease, background 0.3s ease";
    // Transition for spring bounce-back on mouseleave
    const T_RETURN =
      "transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, border-color 0.2s ease, background 0.3s ease";

    cards.forEach((card) => {
      // Inject the cursor-following shine overlay
      const shine = document.createElement("div");
      shine.className = "card-shine";
      card.appendChild(shine);

      let returnTimer = null;

      card.addEventListener("mouseenter", () => {
        clearTimeout(returnTimer);
        // Disable spring on transform so tilt tracks cursor instantly
        card.style.transition = T_TRACKING;
        shine.style.opacity = "1";
      });

      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();

        // Normalise cursor position: -1 (top/left) → +1 (bottom/right)
        const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;

        const rotateY = nx * MAX_TILT; // lean left/right
        const rotateX = -ny * MAX_TILT; // lean forward/back

        card.style.transform =
          `perspective(${PERSPECTIVE}px) ` +
          `rotateX(${rotateX.toFixed(2)}deg) ` +
          `rotateY(${rotateY.toFixed(2)}deg) ` +
          `translateY(-10px) scale(1.02)`;

        // Shine highlights the side facing the "light" (opposite to cursor)
        const px = (((nx + 1) / 2) * 100).toFixed(1);
        const py = (((ny + 1) / 2) * 100).toFixed(1);
        shine.style.background =
          `radial-gradient(circle at ${px}% ${py}%, ` +
          `rgba(255,255,255,0.11) 0%, transparent 56%)`;
      });

      card.addEventListener("mouseleave", () => {
        // Spring bounce-back to resting position
        card.style.transition = T_RETURN;
        card.style.transform = "";
        shine.style.opacity = "0";
        // Remove inline transition after animation finishes → CSS takes over
        returnTimer = setTimeout(() => {
          card.style.transition = "";
        }, 620);
      });
    });
  }

  // ================================================================
  // MAGNETIC BUTTONS — .btn--primary attracts to nearby cursor
  // ================================================================
  function initMagnetic() {
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const buttons = [...document.querySelectorAll(".btn--primary")];
    if (!buttons.length) return;

    const THRESHOLD = 90; // px from button centre to start pull
    const STRENGTH = 0.26; // fraction of distance to move

    let rafId = null;
    let mouseX = 0;
    let mouseY = 0;

    // When cursor enters button, clear magnetic offset — CSS :hover takes over
    buttons.forEach((btn) => {
      btn.addEventListener("mouseenter", () => {
        btn.style.transform = "";
        btn.style.transition = "";
      });
    });

    document.addEventListener(
      "mousemove",
      (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // Throttle to one rAF per frame
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          rafId = null;

          buttons.forEach((btn) => {
            // While cursor is on the button, CSS :hover handles the transform
            if (btn.matches(":hover")) return;

            const rect = btn.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = mouseX - cx;
            const dy = mouseY - cy;
            const dist = Math.hypot(dx, dy);

            if (dist < THRESHOLD) {
              // Pull button slightly toward cursor
              const pull = (1 - dist / THRESHOLD) * STRENGTH;
              btn.style.transform = `translate(${(dx * pull).toFixed(2)}px, ${(dy * pull).toFixed(2)}px)`;
              btn.style.transition = "transform 0.12s ease";
            } else if (btn.style.transform) {
              // Cursor left the threshold — spring back to origin
              btn.style.transform = "";
              btn.style.transition =
                "transform 0.40s cubic-bezier(0.34, 1.56, 0.64, 1)";
            }
          });
        });
      },
      { passive: true },
    );
  }

  // ================================================================
  // CONTACT MODAL
  // ================================================================
  const modalOverlay = document.getElementById("contactModal");
  const modalClose = document.getElementById("modalClose");
  const contactForm = document.getElementById("contactForm");
  const modalProduct = document.getElementById("modalProduct");

  window.openContactModal = function (productName) {
    if (!modalOverlay) return;
    if (modalProduct)
      modalProduct.textContent = productName ? `Enquiry: ${productName}` : "";
    modalOverlay.classList.add("open");
    document.body.style.overflow = "hidden";
    setTimeout(() => {
      const firstInput = modalOverlay.querySelector("input");
      if (firstInput) firstInput.focus();
    }, 50);
  };

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modalOverlay)
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      showToast("Message sent! We'll reply within 2 hours.");
      closeModal();
      contactForm.reset();
    });
  }

  // ================================================================
  // INIT
  // ================================================================
  initTilt();
  initMagnetic();
})();
