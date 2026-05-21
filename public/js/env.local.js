// Local environment configuration (DO NOT COMMIT real secrets to public repos)
// Replace the placeholder values below with your actual keys and passwords

window.APP_ENV = {
  FIREBASE_CONFIG: {
    apiKey: "AIzaSyBFx4Uey-Ydg-cRjSECIPP1LlQeEAz54FA",
    authDomain: "global-777.firebaseapp.com",
    projectId: "global-777",
    storageBucket: "global-777.firebasestorage.app",
    messagingSenderId: "824865737650",
    appId: "1:824865737650:web:3279f52e168d2556e072ab",
    measurementId: "G-1VQ1B4W9ER"

  },
  CLOUDINARY: {
    // For client-side uploads, use an unsigned upload preset
    cloudName: "ddwm6wu3n",
    unsignedUploadPreset: "designs",
  },
  // Optional: base URL for auth API (OTP server)
  AUTH_API_BASE: "http://localhost:4000",
  ADMIN_PASSWORD: "admin123",
  UPI: {
    // Configure your real UPI ID and optional hosted QR image URL
    id: "sarathimurali0000-3@okaxis",
    qrImageUrl: "assets/images/upiQR.jpg",
  },
};



