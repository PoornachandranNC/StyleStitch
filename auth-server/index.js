require("dotenv").config();

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
  })
);

// In-memory store for pending OTPs (per email)
const pendingOtps = new Map();

function generateOtp() {
  return ("" + Math.floor(100000 + Math.random() * 900000));
}

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 587);

  if (!host || !user || !pass) {
    console.warn("SMTP config missing. OTP emails will not send.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

const transporter = createTransporter();

app.post("/api/signup/start", async (req, res) => {
  const { name, email, phone, password } = req.body || {};

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ success: false, message: "Missing fields." });
  }

  const otp = generateOtp();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  pendingOtps.set(email, { otp, expiresAt });

  const from = process.env.FROM_EMAIL || process.env.SMTP_USER;

  if (!from || !transporter) {
    console.error("SMTP not configured; cannot send OTP email.");
    return res
      .status(500)
      .json({ success: false, message: "Email sending not configured on server." });
  }

  const mailOptions = {
    from,
    to: email,
    subject: "Global Fashion Styles RegistrationOTP",
    text: `Dear ${name},\n\nYour OTP for account signup is: ${otp}\nThis code is valid for 10 minutes.\n\n- Global Fashion Styles`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "OTP sent to email." });
  } catch (e) {
    console.error("Failed to send OTP email", e);
    res.status(500).json({ success: false, message: "Could not send OTP email." });
  }
});

app.post("/api/signup/verify", (req, res) => {
  const { email, otp } = req.body || {};
  if (!email || !otp) {
    return res.status(400).json({ success: false, message: "Email and OTP are required." });
  }

  const record = pendingOtps.get(email);
  if (!record) {
    return res.status(400).json({ success: false, message: "No OTP pending for this email." });
  }

  if (Date.now() > record.expiresAt) {
    pendingOtps.delete(email);
    return res.status(400).json({ success: false, message: "OTP expired. Please request again." });
  }

  if (record.otp !== String(otp).trim()) {
    return res.status(400).json({ success: false, message: "Invalid OTP." });
  }

  // Success
  pendingOtps.delete(email);
  res.json({ success: true, message: "OTP verified." });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`Auth server listening on port ${port}`);
});
