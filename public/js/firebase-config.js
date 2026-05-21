// Firebase configuration: prefer env.local.js values, fallback to concrete defaults
// eslint-disable-next-line no-unused-vars
const firebaseConfig = (window.APP_ENV && window.APP_ENV.FIREBASE_CONFIG) || {
  apiKey: "AIzaSyBFx4Uey-Ydg-cRjSECIPP1LlQeEAz54FA",
  authDomain: "global-777.firebaseapp.com",
  projectId: "global-777",
  storageBucket: "global-777.firebasestorage.app",
  messagingSenderId: "824865737650",
  appId: "1:824865737650:web:3279f52e168d2556e072ab",
  measurementId: "G-1VQ1B4W9ER",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Global helpers
// eslint-disable-next-line no-unused-vars
const db = firebase.firestore();
// Keeping storage reference in case you still want Firebase Storage elsewhere
// eslint-disable-next-line no-unused-vars
const storage = firebase.storage();

