(function () {
  if (typeof db === "undefined") {
    console.warn("Firebase not initialized; login will not work.");
    return;
  }

  const form = document.getElementById("login-form");
  const emailEl = document.getElementById("login-email");
  const passwordEl = document.getElementById("login-password");
  const statusEl = document.getElementById("login-status");

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text || "";
  }

  async function handleLogin(e) {
    e.preventDefault();
    const email = emailEl.value.trim();
    const password = passwordEl.value.trim();

    if (!email || !password) {
      setStatus("Please enter email and password.");
      return;
    }

    setStatus("Checking account...");

    try {
      const doc = await db.collection("customers").doc(email).get();
      if (!doc.exists) {
        setStatus("Account not found. Please sign up.");
        return;
      }
      const data = doc.data();
      if (!data.password || data.password !== password) {
        setStatus("Incorrect password.");
        return;
      }

      setStatus("Login successful. Redirecting...");
      // Store minimal session locally
      const session = {
        email,
        name: data.name || "",
        phone: data.phone || "",
      };
      localStorage.setItem("customerSession", JSON.stringify(session));

      // Redirect to home page after login
      setTimeout(function () {
        window.location.href = "index.html";
      }, 1000);
    } catch (e) {
      console.error("Login failed", e);
      setStatus("Could not login. Please try again.");
    }
  }

  if (form) {
    form.addEventListener("submit", handleLogin);
  }
})();
