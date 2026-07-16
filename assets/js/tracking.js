"use strict";

/*====================================
TRỨNG GÀ THẢO DƯỢC SADU — TRACKING & ANALYTICS
assets/js/tracking.js
Vanilla JavaScript ES6+ — Độc lập hoàn toàn với script.js (không đổi logic
script.js, chỉ lắng nghe 2 custom event "sadu:order-success" /
"sadu:order-invalid" mà script.js phát ra khi submit form).
Thứ tự: Config → Utilities → Components → Events → Initialization
====================================*/

(() => {
  /*====================================
  1. Config
  ====================================*/
  const SELECTORS = {
    orderForm: ".order-form__form",
    floatingCta: ".floating-cta",
    trackClick:
      "[data-track], .header__cta, .header__menu-link, .hero__button, .pain-point__cta, .comparison__cta, .combo__card-cta, .dishes__cta, .commitment__cta, .final-cta__button, .order-form__submit, .floating-cta__button, .footer__social-link",
  };

  const CONFIG = {
    scrollThresholds: [25, 50, 75, 100],
    scrollThrottleMs: 200,
    exitIntentMinWidth: 1024,
    thankYouUrl: "thank-you.html",
    redirectDelayMs: 1200,
    utmKeys: ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"],
    utmStorageKey: "sadu_utm_params",
    exitIntentStorageKey: "sadu_exit_intent_shown",
    currency: "VND",
    productName: "Trung Ga Thao Duoc SADU",
    productCategory: "Egg Landing Page",
  };

  /*====================================
  2. Utilities
  ====================================*/
  const select = (selector, scope = document) => scope.querySelector(selector);

  const serializeCombo = (combo) => {
    if (Array.isArray(combo)) return combo.join(" | ");
    return combo || "";
  };

  const throttle = (fn, delay) => {
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

  window.dataLayer = window.dataLayer || [];

  /**
   * Đẩy event vào dataLayer (GTM/GA4) và gọi trực tiếp gtag/fbq/ttq
   * nếu các SDK đó đã load. An toàn khi bất kỳ SDK nào chưa sẵn sàng.
   */
  const trackEvent = (eventName, params = {}) => {
    try {
      window.dataLayer.push({ event: eventName, ...params });
      window.gtag?.("event", eventName, params);
      window.fbq?.("trackCustom", eventName, params);
      window.ttq?.track(eventName, params);
    } catch (error) {
      console.error("Gửi tracking event thất bại:", error);
    }
  };

  const trackMetaStandard = (eventName, params = {}) => {
    try {
      window.fbq?.("track", eventName, params);
    } catch (error) {
      console.error("Gui Meta standard event that bai:", error);
    }
  };

  const getUtmParamsFromUrl = () => {
    const search = new URLSearchParams(window.location.search);
    const utm = {};
    CONFIG.utmKeys.forEach((key) => {
      const value = search.get(key);
      if (value) utm[key] = value;
    });
    return utm;
  };

  const persistUtmParams = (utm) => {
    if (!Object.keys(utm).length) return;
    try {
      window.sessionStorage.setItem(CONFIG.utmStorageKey, JSON.stringify(utm));
    } catch (error) {
      console.error("Không thể lưu UTM params:", error);
    }
  };

  const readStoredUtmParams = () => {
    try {
      const raw = window.sessionStorage.getItem(CONFIG.utmStorageKey);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      return {};
    }
  };

  /*====================================
  3. Components — Exit Intent Popup
  Tạo DOM động bằng JS (giống cơ chế Toast ở script.js) — không thêm
  bất kỳ phần tử nào vào index.html. Nội dung lấy đúng nguyên văn từ
  Hero (offer + CTA) đã có sẵn trên trang, không tự viết nội dung mới.
  ====================================*/
  let exitIntentTriggered = false;

  const closeExitIntentPopup = (overlay, modal) => {
    overlay.style.opacity = "0";
    modal.style.transform = "translateY(16px)";
    window.setTimeout(() => overlay.remove(), 300);
  };

  const buildExitIntentPopup = () => {
    const overlay = document.createElement("div");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "sadu-exit-intent-heading");
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      backgroundColor: "rgba(31, 51, 39, 0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      zIndex: "1100",
      opacity: "0",
      transition: "opacity 0.3s ease",
    });

    const modal = document.createElement("div");
    Object.assign(modal.style, {
      position: "relative",
      width: "100%",
      maxWidth: "420px",
      backgroundColor: "var(--color-surface, #FFFFFF)",
      borderRadius: "var(--radius, 20px)",
      padding: "40px 32px",
      textAlign: "center",
      boxShadow: "0 20px 48px rgba(0, 0, 0, 0.25)",
      transform: "translateY(16px)",
      transition: "transform 0.3s ease",
    });

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Đóng thông báo ưu đãi");
    closeBtn.textContent = "×";
    Object.assign(closeBtn.style, {
      position: "absolute",
      top: "10px",
      right: "14px",
      fontSize: "26px",
      lineHeight: "1",
      color: "var(--color-text-light, #55635A)",
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "4px 8px",
    });

    const heading = document.createElement("h2");
    heading.id = "sadu-exit-intent-heading";
    heading.textContent = "Ưu đãi hôm nay";
    Object.assign(heading.style, {
      fontSize: "20px",
      fontWeight: "700",
      color: "var(--color-primary, #2E7D32)",
      marginBottom: "12px",
    });

    const text = document.createElement("p");
    text.textContent =
      "Mua 3 hộp tặng 1 hộp. Mua 6 hộp tặng 2 hộp + tặng trà Cà Gai Leo Tía Tô 100g.";
    Object.assign(text.style, {
      fontSize: "16px",
      color: "var(--color-text-light, #55635A)",
      marginBottom: "24px",
    });

    const ctaBtn = document.createElement("a");
    ctaBtn.href = "#dat-hang";
    ctaBtn.textContent = "Đặt Trứng SADU Ngay";
    Object.assign(ctaBtn.style, {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "14px 32px",
      borderRadius: "999px",
      backgroundColor: "var(--color-primary, #2E7D32)",
      color: "#FFFFFF",
      fontWeight: "600",
      textDecoration: "none",
    });

    modal.append(closeBtn, heading, text, ctaBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
      modal.style.transform = "translateY(0)";
    });

    closeBtn.addEventListener("click", () => {
      trackEvent("exit_intent_dismissed");
      closeExitIntentPopup(overlay, modal);
    });

    overlay.addEventListener("click", (event) => {
      if (event.target !== overlay) return;
      trackEvent("exit_intent_dismissed");
      closeExitIntentPopup(overlay, modal);
    });

    ctaBtn.addEventListener("click", () => {
      trackEvent("exit_intent_cta_click");
      closeExitIntentPopup(overlay, modal);
    });

    document.addEventListener("keydown", function handleEscape(event) {
      if (event.key !== "Escape") return;
      trackEvent("exit_intent_dismissed");
      closeExitIntentPopup(overlay, modal);
      document.removeEventListener("keydown", handleEscape);
    });

    trackEvent("exit_intent_shown");
  };

  /*====================================
  4. Events
  ====================================*/
  const handleTrackedClick = (event) => {
    const el = event.target.closest(SELECTORS.trackClick);
    if (!el) return;
    trackEvent("cta_click", {
      link_text: el.textContent.trim().slice(0, 100),
      link_url: el.getAttribute("href") ?? "",
      link_id: el.id || "",
    });
  };

  const handleExitIntentMouseLeave = (event) => {
    if (event.clientY > 0) return;
    if (exitIntentTriggered) return;
    exitIntentTriggered = true;
    try {
      window.sessionStorage.setItem(CONFIG.exitIntentStorageKey, "1");
    } catch (error) {
      /* sessionStorage không khả dụng — vẫn hiển thị popup lần này */
    }
    buildExitIntentPopup();
    document.removeEventListener("mouseleave", handleExitIntentMouseLeave);
  };

  /*====================================
  5. Initialization
  ====================================*/
  const initUtmTracking = () => {
    const utmFromUrl = getUtmParamsFromUrl();
    if (Object.keys(utmFromUrl).length) {
      persistUtmParams(utmFromUrl);
      trackEvent("utm_captured", utmFromUrl);
    }
  };

  const initScrollTracking = () => {
    const firedThresholds = new Set();

    const handleScroll = throttle(() => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const scrollPercent = Math.round((window.scrollY / docHeight) * 100);

      CONFIG.scrollThresholds.forEach((threshold) => {
        if (scrollPercent < threshold || firedThresholds.has(threshold)) return;
        firedThresholds.add(threshold);
        trackEvent("scroll_depth", { percent_scrolled: threshold });
      });
    }, CONFIG.scrollThrottleMs);

    window.addEventListener("scroll", handleScroll, { passive: true });
  };

  const initClickTracking = () => {
    document.addEventListener("click", handleTrackedClick);
  };

  const initFormTracking = () => {
    const form = select(SELECTORS.orderForm);
    if (!form) return;
    let checkoutTracked = false;

    const trackInitiateCheckout = () => {
      if (checkoutTracked) return;
      checkoutTracked = true;
      trackEvent("initiate_checkout", {
        content_name: CONFIG.productName,
        content_category: CONFIG.productCategory,
      });
      trackMetaStandard("InitiateCheckout", {
        content_name: CONFIG.productName,
        content_category: CONFIG.productCategory,
        currency: CONFIG.currency,
      });
    };

    form.addEventListener("focusin", trackInitiateCheckout, { once: true });

    form.addEventListener("sadu:order-success", (event) => {
      const utm = readStoredUtmParams();
      const combo = event.detail?.combo ?? [];
      trackEvent("generate_lead", { ...utm, combo });
      trackMetaStandard("Lead", {
        content_name: CONFIG.productName,
        content_category: CONFIG.productCategory,
        currency: CONFIG.currency,
        combo: serializeCombo(combo),
      });
      window.setTimeout(() => {
        window.location.href = CONFIG.thankYouUrl;
      }, CONFIG.redirectDelayMs);
    });

    form.addEventListener("sadu:order-invalid", () => {
      trackEvent("form_error", { form_name: "order_form" });
    });
  };

  const initExitIntent = () => {
    if (window.innerWidth < CONFIG.exitIntentMinWidth) return;
    try {
      if (window.sessionStorage.getItem(CONFIG.exitIntentStorageKey)) return;
    } catch (error) {
      return;
    }
    document.addEventListener("mouseleave", handleExitIntentMouseLeave);
  };

  const initStickyCtaOptimization = () => {
    const floatingCta = select(SELECTORS.floatingCta);
    const form = select(SELECTORS.orderForm);
    if (!floatingCta || !form) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          floatingCta.style.opacity = "0";
          floatingCta.style.pointerEvents = "none";
        } else {
          floatingCta.style.opacity = "";
          floatingCta.style.pointerEvents = "";
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(form);
  };

  const initThankYouConversion = () => {
    if (!/thank-you\.html$/.test(window.location.pathname)) return;
    trackEvent("conversion_thank_you_view", readStoredUtmParams());
  };

  const init = () => {
    try {
      initUtmTracking();
      initScrollTracking();
      initClickTracking();
      initFormTracking();
      initExitIntent();
      initStickyCtaOptimization();
      initThankYouConversion();
    } catch (error) {
      console.error("SADU tracking initialization failed:", error);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
