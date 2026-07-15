"use strict";

/*====================================
TRỨNG GÀ THẢO DƯỢC SADU — LANDING PAGE
Sprint 3 — assets/js/script.js
Vanilla JavaScript ES6+ — Không thư viện ngoài
Thứ tự: Config → DOM Cache → Utilities → Components → Events → Init
====================================*/

(() => {
  /*====================================
  1. Config
  ====================================*/
  const SELECTORS = {
    header: ".header",
    headerMenu: ".header__menu",
    headerMenuLink: ".header__menu-link",
    headerToggle: ".header__menu-toggle",
    headerOverlay: ".header__overlay",
    floatingCta: ".floating-cta",
    backToTop: ".back-to-top",
    faqDetails: ".faq__details",
    orderForm: ".order-form__form",
    orderFormName: "#ho-ten",
    orderFormPhone: "#so-dien-thoai",
    orderFormAddress: "#dia-chi",
    orderFormCheckbox: ".order-form__checkbox",
    orderFormFieldset: ".order-form__fieldset",
    orderFormSubmit: ".order-form__submit",
    comboGrid: ".combo__grid",
    comboCard: ".combo__card",
    revealTarget:
      "main > section, .usp__card, .combo__card, .feedback__card, .dishes__item, .pain-point__item, .trust-bar__item",
    anchorLink: 'a[href^="#"]',
    rippleTarget:
      ".header__cta, .hero__button, .pain-point__cta, .comparison__cta, .combo__card-cta, .dishes__cta, .commitment__cta, .final-cta__button, .order-form__submit, .floating-cta__button",
  };

  const CLASSES = {
    scrolled: "header--scrolled",
    menuOpen: "header__menu--open",
    overlayVisible: "header__overlay--visible",
    activeLink: "header__menu-link--active",
    cardActive: "combo__card--active",
    visible: "is-visible",
    floatingVisible: "floating-cta--visible",
    error: "order-form__error",
    comboError: "order-form__error--combo",
  };

  const CONFIG = {
    API_URL: "https://script.google.com/macros/s/AKfycbygckU9ra0yZZgHmIjOwV2gryBy8oXMKhYJjRQwnUTuUYphAJn92hoWG8_aVDcfvyg_/exec",
    headerScrollThreshold: 10,
    floatingCtaThreshold: 500,
    backToTopThreshold: 700,
    toastDuration: 4000,
    throttleDelay: 100,
    debounceDelay: 200,
    headerOffsetGap: 16,
    comboCheckboxIds: ["combo-dung-thu", "combo-3-tang-1", "combo-6-tang-2"],
    phoneRegex: /^(0|\+84)(3[2-9]|5[25689]|7[06789]|8[1-9]|9[0-46-9])[0-9]{7}$/,
  };

  const MESSAGES = {
    nameRequired: "Vui lòng nhập họ và tên.",
    phoneInvalid: "Số điện thoại không đúng định dạng Việt Nam.",
    addressRequired: "Vui lòng nhập địa chỉ nhận hàng.",
    comboRequired: "Vui lòng chọn ít nhất một combo.",
    formInvalid: "Vui lòng kiểm tra lại thông tin.",
    apiMissing: "Hệ thống đặt hàng đang được cập nhật. Vui lòng liên hệ Zalo để được hỗ trợ.",
    submitSuccess: "Đặt hàng thành công! SADU sẽ liên hệ với bạn sớm nhất.",
    submitError: "Gửi thông tin thất bại. Vui lòng thử lại sau.",
  };

  /*====================================
  2. DOM Cache
  ====================================*/
  const DOM = {};

  const cacheDom = () => {
    DOM.header = select(SELECTORS.header);
    DOM.headerMenu = select(SELECTORS.headerMenu);
    DOM.headerMenuLinks = selectAll(SELECTORS.headerMenuLink);
    DOM.headerToggle = select(SELECTORS.headerToggle);
    DOM.headerOverlay = select(SELECTORS.headerOverlay);
    DOM.floatingCta = select(SELECTORS.floatingCta);
    DOM.backToTop = select(SELECTORS.backToTop);
    DOM.faqDetailsList = selectAll(SELECTORS.faqDetails);
    DOM.orderForm = select(SELECTORS.orderForm);
    DOM.comboGrid = select(SELECTORS.comboGrid);
    DOM.comboCards = selectAll(SELECTORS.comboCard);
    DOM.comboCheckboxes = selectAll(SELECTORS.orderFormCheckbox);
    DOM.revealTargets = selectAll(SELECTORS.revealTarget);
  };

  /*====================================
  3. Utilities
  ====================================*/
  function select(selector, scope = document) {
    return scope.querySelector(selector);
  }

  function selectAll(selector, scope = document) {
    return [...scope.querySelectorAll(selector)];
  }

  const debounce = (fn, delay = CONFIG.debounceDelay) => {
    let timerId;
    return (...args) => {
      window.clearTimeout(timerId);
      timerId = window.setTimeout(() => fn(...args), delay);
    };
  };

  const throttle = (fn, delay = CONFIG.throttleDelay) => {
    let isThrottled = false;
    return (...args) => {
      if (isThrottled) return;
      isThrottled = true;
      fn(...args);
      window.setTimeout(() => {
        isThrottled = false;
      }, delay);
    };
  };

  const scrollToElement = (target) => {
    if (!target) return;
    const headerHeight = DOM.header?.offsetHeight ?? 0;
    const top =
      target.getBoundingClientRect().top +
      window.pageYOffset -
      headerHeight -
      CONFIG.headerOffsetGap;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const toggleClass = (el, className, force) => {
    if (!el) return;
    el.classList.toggle(className, force);
  };

  let toastContainer = null;

  const ensureToastContainer = () => {
    if (toastContainer) return toastContainer;
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-container";
    toastContainer.setAttribute("role", "status");
    toastContainer.setAttribute("aria-live", "polite");
    Object.assign(toastContainer.style, {
      position: "fixed",
      top: "16px",
      right: "16px",
      zIndex: "1000",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      maxWidth: "360px",
    });
    document.body.appendChild(toastContainer);
    return toastContainer;
  };

  const TOAST_COLORS = {
    success: "var(--color-primary, #2E7D32)",
    warning: "var(--color-warning, #F9A825)",
    error: "var(--color-danger, #D32F2F)",
  };

  const showToast = (message, type = "success") => {
    if (!message) return null;
    const container = ensureToastContainer();
    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    Object.assign(toast.style, {
      padding: "14px 18px",
      borderRadius: "10px",
      color: "#FFFFFF",
      backgroundColor: TOAST_COLORS[type] ?? TOAST_COLORS.success,
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.18)",
      fontSize: "14px",
      lineHeight: "1.5",
      opacity: "0",
      transform: "translateY(-8px)",
      transition: "opacity 0.3s ease, transform 0.3s ease",
    });
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });

    const timerId = window.setTimeout(() => hideToast(toast), CONFIG.toastDuration);
    toast.dataset.timerId = String(timerId);
    return toast;
  };

  const hideToast = (toast) => {
    if (!toast) return;
    const timerId = Number(toast.dataset.timerId);
    if (!Number.isNaN(timerId)) window.clearTimeout(timerId);
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-8px)";
    window.setTimeout(() => toast.remove(), 300);
  };

  const validatePhone = (phone) => CONFIG.phoneRegex.test(phone.trim());

  let lockedScrollY = 0;

  const lockScroll = () => {
    lockedScrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.width = "100%";
  };

  const unlockScroll = () => {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    window.scrollTo(0, lockedScrollY);
  };

  /*====================================
  4. Components
  ====================================*/
  let spinnerIntervalId = null;
  const SPINNER_FRAMES = ["⏳", "⌛"];

  const setButtonLoading = (button, isLoading) => {
    if (!button) return;

    if (isLoading) {
      button.dataset.originalText = button.textContent ?? "";
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      let frame = 0;
      button.textContent = `${SPINNER_FRAMES[0]} Đang xử lý...`;
      spinnerIntervalId = window.setInterval(() => {
        frame += 1;
        button.textContent = `${SPINNER_FRAMES[frame % SPINNER_FRAMES.length]} Đang xử lý...`;
      }, 500);
      return;
    }

    if (spinnerIntervalId !== null) {
      window.clearInterval(spinnerIntervalId);
      spinnerIntervalId = null;
    }
    button.disabled = false;
    button.removeAttribute("aria-busy");
    button.textContent = button.dataset.originalText ?? button.textContent;
    delete button.dataset.originalText;
  };

  const getOrCreateErrorElement = (input) => {
    if (!input?.id) return null;
    const errorId = `${input.id}-error`;
    let errorEl = document.getElementById(errorId);
    if (errorEl) return errorEl;

    errorEl = document.createElement("span");
    errorEl.id = errorId;
    errorEl.className = CLASSES.error;
    errorEl.setAttribute("role", "alert");
    input.insertAdjacentElement("afterend", errorEl);
    input.setAttribute("aria-describedby", errorId);
    return errorEl;
  };

  const setFieldError = (input, message) => {
    if (!input) return;
    input.setCustomValidity(message);
    const errorEl = getOrCreateErrorElement(input);
    if (errorEl) errorEl.textContent = message;
  };

  const clearFieldError = (input) => {
    if (!input) return;
    input.setCustomValidity("");
    const errorEl = document.getElementById(`${input.id}-error`);
    if (errorEl) errorEl.textContent = "";
  };

  const getOrCreateComboError = (fieldset) => {
    if (!fieldset) return null;
    let errorEl = fieldset.querySelector(`.${CLASSES.comboError}`);
    if (errorEl) return errorEl;

    errorEl = document.createElement("span");
    errorEl.className = `${CLASSES.error} ${CLASSES.comboError}`;
    errorEl.setAttribute("role", "alert");
    fieldset.appendChild(errorEl);
    return errorEl;
  };

  const validateForm = ({ nameInput, phoneInput, addressInput, comboInputs, fieldset }) => {
    let isValid = true;

    const nameValue = nameInput?.value.trim() ?? "";
    if (!nameValue) {
      setFieldError(nameInput, MESSAGES.nameRequired);
      isValid = false;
    } else {
      clearFieldError(nameInput);
    }

    const phoneValue = phoneInput?.value.trim() ?? "";
    if (!validatePhone(phoneValue)) {
      setFieldError(phoneInput, MESSAGES.phoneInvalid);
      isValid = false;
    } else {
      clearFieldError(phoneInput);
    }

    const addressValue = addressInput?.value.trim() ?? "";
    if (!addressValue) {
      setFieldError(addressInput, MESSAGES.addressRequired);
      isValid = false;
    } else {
      clearFieldError(addressInput);
    }

    const hasCombo = comboInputs.some((input) => input.checked);
    const comboErrorEl = getOrCreateComboError(fieldset);
    if (!hasCombo) {
      if (comboErrorEl) comboErrorEl.textContent = MESSAGES.comboRequired;
      isValid = false;
    } else if (comboErrorEl) {
      comboErrorEl.textContent = "";
    }

    return isValid;
  };

  const syncComboSelection = (cards, checkboxesByIndex) => {
    cards.forEach((card, index) => {
      const checkbox = checkboxesByIndex[index];
      if (!checkbox) return;
      toggleClass(card, CLASSES.cardActive, checkbox.checked);
    });
  };

  /*====================================
  5. Events
  ====================================*/
  const handleAnchorClick = (event) => {
    const link = event.target.closest(SELECTORS.anchorLink);
    if (!link) return;

    const hash = link.getAttribute("href");
    if (!hash || hash === "#") {
      event.preventDefault();
      return;
    }

    let target;
    try {
      target = document.querySelector(hash);
    } catch {
      return;
    }
    if (!target) return;

    event.preventDefault();
    scrollToElement(target);
  };

  const handleComboCardClick = (event) => {
    const card = event.target.closest(SELECTORS.comboCard);
    if (!card) return;

    const index = DOM.comboCards.indexOf(card);
    if (index === -1) return;

    const checkboxesByIndex = CONFIG.comboCheckboxIds.map((id) => document.getElementById(id));
    const targetCheckbox = checkboxesByIndex[index];
    if (!targetCheckbox) return;

    DOM.comboCheckboxes.forEach((checkbox) => {
      checkbox.checked = false;
    });
    targetCheckbox.checked = true;
    targetCheckbox.dispatchEvent(new Event("change", { bubbles: true }));

    syncComboSelection(DOM.comboCards, checkboxesByIndex);
  };

  const handleComboCheckboxChange = () => {
    const checkboxesByIndex = CONFIG.comboCheckboxIds.map((id) => document.getElementById(id));
    syncComboSelection(DOM.comboCards, checkboxesByIndex);
  };

  const handleRippleClick = (event) => {
    const button = event.target.closest(SELECTORS.rippleTarget);
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const isKeyboardTriggered = event.detail === 0;
    const x = isKeyboardTriggered ? rect.width / 2 : event.clientX - rect.left;
    const y = isKeyboardTriggered ? rect.height / 2 : event.clientY - rect.top;

    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x - size / 2}px`;
    ripple.style.top = `${y - size / 2}px`;

    button.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  };

  const handleFaqToggle = (details) => {
    if (!details.open) return;
    DOM.faqDetailsList
      .filter((item) => item !== details)
      .forEach((item) => {
        item.open = false;
      });
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;

    const nameInput = select(SELECTORS.orderFormName, form);
    const phoneInput = select(SELECTORS.orderFormPhone, form);
    const addressInput = select(SELECTORS.orderFormAddress, form);
    const comboInputs = selectAll(SELECTORS.orderFormCheckbox, form);
    const fieldset = select(SELECTORS.orderFormFieldset, form);
    const submitButton = select(SELECTORS.orderFormSubmit, form);

    const isValid = validateForm({ nameInput, phoneInput, addressInput, comboInputs, fieldset });
    if (!isValid) {
      showToast(MESSAGES.formInvalid, "warning");
      form.dispatchEvent(new CustomEvent("sadu:order-invalid", { bubbles: true }));
      return;
    }

    if (!CONFIG.API_URL) {
      showToast(MESSAGES.apiMissing, "warning");
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const selectedCombos = comboInputs
      .filter((input) => input.checked)
      .map((input) => input.value);

    const payload = {
      ho_ten: nameInput.value.trim(),
      so_dien_thoai: phoneInput.value.trim(),
      dia_chi: addressInput.value.trim(),
      combo: selectedCombos.join(", "),
      utm_source: urlParams.get("utm_source") ?? "",
      utm_medium: urlParams.get("utm_medium") ?? "",
      utm_campaign: urlParams.get("utm_campaign") ?? "",
      userAgent: window.navigator.userAgent ?? "",
    };

    setButtonLoading(submitButton, true);

    try {
      const response = await fetch(CONFIG.API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);

      showToast(MESSAGES.submitSuccess, "success");
      form.reset();
      DOM.comboCards.forEach((card) => toggleClass(card, CLASSES.cardActive, false));
      form.dispatchEvent(new CustomEvent("sadu:order-success", { bubbles: true, detail: payload }));
    } catch (error) {
      console.error("Order form submission failed:", error);
      showToast(MESSAGES.submitError, "error");
    } finally {
      setButtonLoading(submitButton, false);
    }
  };

  /*====================================
  6. Initialization
  ====================================*/

  /*====================================
  Sticky Header + Active Navigation
  ====================================*/
  const initActiveNavigation = () => {
    const links = DOM.headerMenuLinks;
    if (!links.length) return;

    const linkByHash = new Map(links.map((link) => [link.getAttribute("href"), link]));
    const sections = [...linkByHash.keys()]
      .map((hash) => {
        try {
          return document.querySelector(hash);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    if (!sections.length) return;

    const setActiveLink = (activeLink) => {
      links.forEach((link) => {
        const isActive = link === activeLink;
        toggleClass(link, CLASSES.activeLink, isActive);
        if (isActive) {
          link.setAttribute("aria-current", "page");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const topEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!topEntry) return;
        const activeLink = linkByHash.get(`#${topEntry.target.id}`);
        if (activeLink) setActiveLink(activeLink);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0.1, 0.25, 0.5, 0.75] }
    );

    sections.forEach((section) => observer.observe(section));
  };

  const initHeader = () => {
    const header = DOM.header;
    if (!header) return;

    const handleScroll = throttle(() => {
      toggleClass(header, CLASSES.scrolled, window.scrollY > CONFIG.headerScrollThreshold);
    }, CONFIG.throttleDelay);

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    initActiveNavigation();
  };

  /*====================================
  Mobile Menu
  ====================================*/
  const initMenu = () => {
    const toggle = DOM.headerToggle;
    const menu = DOM.headerMenu;
    if (!toggle || !menu) return;

    const overlay = DOM.headerOverlay;

    const openMenu = () => {
      toggleClass(menu, CLASSES.menuOpen, true);
      toggle.setAttribute("aria-expanded", "true");
      toggleClass(overlay, CLASSES.overlayVisible, true);
      lockScroll();
    };

    const closeMenu = () => {
      toggleClass(menu, CLASSES.menuOpen, false);
      toggle.setAttribute("aria-expanded", "false");
      toggleClass(overlay, CLASSES.overlayVisible, false);
      unlockScroll();
    };

    toggle.addEventListener("click", () => {
      const isOpen = menu.classList.contains(CLASSES.menuOpen);
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    overlay?.addEventListener("click", closeMenu);

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (!menu.classList.contains(CLASSES.menuOpen)) return;
      closeMenu();
    });

    document.addEventListener("click", (event) => {
      if (!menu.classList.contains(CLASSES.menuOpen)) return;
      if (menu.contains(event.target) || toggle.contains(event.target)) return;
      closeMenu();
    });
  };

  /*====================================
  Smooth Scroll
  ====================================*/
  const initSmoothScroll = () => {
    document.addEventListener("click", handleAnchorClick);
  };

  /*====================================
  FAQ Accordion
  ====================================*/
  const initFAQ = () => {
    const detailsList = DOM.faqDetailsList;
    if (!detailsList.length) return;

    detailsList.forEach((details) => {
      details.addEventListener("toggle", () => handleFaqToggle(details));
    });
  };

  /*====================================
  Order Form
  ====================================*/
  const initForm = () => {
    const form = DOM.orderForm;
    if (!form) return;
    form.addEventListener("submit", handleFormSubmit);
  };

  /*====================================
  Combo Selection
  ====================================*/
  const initCombo = () => {
    const grid = DOM.comboGrid;
    if (!grid || !DOM.comboCards.length) return;

    grid.addEventListener("click", handleComboCardClick);
    DOM.comboCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", handleComboCheckboxChange);
    });
  };

  /*====================================
  Toast Notifications
  ====================================*/
  const initToast = () => {
    ensureToastContainer();
  };

  /*====================================
  Back To Top
  ====================================*/
  const initBackToTop = () => {
    const backToTop = DOM.backToTop;
    if (!backToTop) return;

    const handleScroll = throttle(() => {
      toggleClass(backToTop, CLASSES.visible, window.scrollY > CONFIG.backToTopThreshold);
    }, CONFIG.throttleDelay);

    backToTop.addEventListener("click", (event) => {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
  };

  /*====================================
  Floating CTA
  ====================================*/
  const initFloatingCTA = () => {
    const floatingCta = DOM.floatingCta;
    if (!floatingCta) return;

    const handleScroll = throttle(() => {
      toggleClass(floatingCta, CLASSES.floatingVisible, window.scrollY > CONFIG.floatingCtaThreshold);
    }, CONFIG.throttleDelay);

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
  };

  /*====================================
  Button Ripple
  ====================================*/
  const initRipple = () => {
    document.addEventListener("click", handleRippleClick);
  };

  /*====================================
  Scroll Reveal
  ====================================*/
  const initScrollReveal = () => {
    const targets = DOM.revealTargets;
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          toggleClass(entry.target, CLASSES.visible, true);
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.15 }
    );

    targets.forEach((target) => observer.observe(target));
  };

  /*====================================
  App Init
  ====================================*/
  const init = () => {
    try {
      cacheDom();
      initHeader();
      initMenu();
      initSmoothScroll();
      initFAQ();
      initForm();
      initCombo();
      initToast();
      initBackToTop();
      initFloatingCTA();
      initScrollReveal();
      initRipple();
    } catch (error) {
      console.error("SADU landing page initialization failed:", error);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
