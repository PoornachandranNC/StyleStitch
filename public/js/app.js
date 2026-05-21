// Shared helpers for all pages

(function () {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toString();
  }

  // Utility: read query param
  window.getQueryParam = function (key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  };

  // Utility: simple device check
  window.isMobile = function () {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  };

  // Simple customer session helpers using localStorage
  window.getCustomerSession = function () {
    try {
      const raw = localStorage.getItem("customerSession");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  };

  window.requireCustomerLogin = function () {
    const path = window.location.pathname || "";
    const file = path.split("/").pop() || "";
    const publicPages = ["signup.html", "login.html", "admin.html", "ar.html"]; // pages that don't force login
    if (publicPages.includes(file)) return;

    const session = window.getCustomerSession();
    if (!session) {
      window.location.href = "login.html";
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    window.requireCustomerLogin();

    try {
      const session = window.getCustomerSession && window.getCustomerSession();
      const nav = document.querySelector(".site-header .main-nav");
      if (!nav) return;

      const signupLink = nav.querySelector('a[href="signup.html"]');
      const loginLink = nav.querySelector('a[href="login.html"]');

      if (!session) {
        if (signupLink) signupLink.classList.remove("hidden");
        if (loginLink) loginLink.classList.remove("hidden");
        const existingMenu = nav.querySelector(".user-menu");
        if (existingMenu) existingMenu.remove();
        return;
      }

      if (signupLink) signupLink.classList.add("hidden");
      if (loginLink) loginLink.classList.add("hidden");

      if (nav.querySelector(".user-menu")) return;

      const displayName = session.name || session.email || session.phone || "My Account";
      const userMenu = document.createElement("div");
      userMenu.className = "user-menu";
      userMenu.innerHTML =
        '<button type="button" class="user-menu-toggle">' +
        '<span class="user-menu-name">' +
        displayName +
        "</span>" +
        '<span class="user-menu-caret">▾</span>' +
        "</button>" +
        '<div class="user-menu-dropdown hidden">' +
        '<button type="button" class="user-menu-item" data-action="logout">Logout</button>' +
        "</div>";

      nav.appendChild(userMenu);

      const toggleBtn = userMenu.querySelector(".user-menu-toggle");
      const dropdown = userMenu.querySelector(".user-menu-dropdown");
      const logoutBtn = userMenu.querySelector('[data-action="logout"]');

      if (toggleBtn && dropdown) {
        toggleBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          dropdown.classList.toggle("hidden");
        });

        document.addEventListener("click", function (e) {
          if (!userMenu.contains(e.target)) {
            dropdown.classList.add("hidden");
          }
        });
      }

      if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
          try {
            localStorage.removeItem("customerSession");
          } catch (e) {}
          window.location.href = "login.html";
        });
      }
    } catch (e) {
      // ignore header auth UI errors
    }
  });
})();
