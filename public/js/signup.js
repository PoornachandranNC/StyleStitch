(function () {
  if (typeof db === "undefined") {
    console.warn("Firebase not initialized; signup will not work.");
    return;
  }

  const form = document.getElementById("signup-form");
  const nameEl = document.getElementById("signup-name");
  const emailEl = document.getElementById("signup-email");
  const phoneEl = document.getElementById("signup-phone");
  const passwordEl = document.getElementById("signup-password");
  const otpSection = document.getElementById("otp-section");
  const otpEl = document.getElementById("signup-otp");
  const statusEl = document.getElementById("signup-status");
  const submitBtn = document.getElementById("signup-submit-btn");

  let step = 1; // 1 = send OTP, 2 = verify

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text || "";
  }

  function getApiBase() {
    // Adjust port if you run the auth server on a different port
    return window.APP_ENV && window.APP_ENV.AUTH_API_BASE
      ? window.APP_ENV.AUTH_API_BASE
      : "http://localhost:4000";
  }

  async function sendOtp() {
    const name = nameEl.value.trim();
    const email = emailEl.value.trim();
    const phone = phoneEl.value.trim();
    const password = passwordEl.value.trim();

    if (!name || !email || !phone || !password) {
      setStatus("Please fill all fields.");
      return;
    }

    setStatus("Sending OTP to your email...");
    submitBtn.disabled = true;

    try {
      const res = await fetch(getApiBase() + "/api/signup/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setStatus(data.message || "Could not send OTP. Please try again.");
        submitBtn.disabled = false;
        return;
      }

      setStatus("OTP sent. Please check your email.");
      otpSection.style.display = "block";
      submitBtn.textContent = "Verify OTP";
      submitBtn.disabled = false;
      step = 2;
    } catch (e) {
      console.error("OTP send failed", e);
      setStatus("Could not send OTP. Check server.");
      submitBtn.disabled = false;
    }
  }

  async function verifyOtpAndCreateAccount() {
    const email = emailEl.value.trim();
    const otp = otpEl.value.trim();

    if (!otp) {
      setStatus("Please enter the OTP from your email.");
      return;
    }

    setStatus("Verifying OTP...");
    submitBtn.disabled = true;

    try {
      const res = await fetch(getApiBase() + "/api/signup/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setStatus(data.message || "Invalid OTP. Please try again.");
        submitBtn.disabled = false;
        return;
      }

      // OTP ok -> create customer document in Firestore
      const name = nameEl.value.trim();
      const phone = phoneEl.value.trim();
      const password = passwordEl.value.trim();

      await db.collection("customers").doc(email).set({
        name,
        email,
        phone,
        password,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      setStatus("Account created successfully. Redirecting to login...");
      submitBtn.disabled = true;

      // Redirect to login page after short delay
      setTimeout(function () {
        window.location.href = "login.html";
      }, 1200);
    } catch (e) {
      console.error("Signup failed", e);
      setStatus("Could not create account. Please try again.");
      submitBtn.disabled = false;
    }
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (step === 1) {
        sendOtp();
      } else {
        verifyOtpAndCreateAccount();
      }
    });
  }
})();
