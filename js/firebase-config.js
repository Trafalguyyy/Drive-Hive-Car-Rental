// ✅ Correct Firebase ES Module Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Firebase Configuration (Replace with your Firebase project details)
const firebaseConfig = {
  apiKey: "AIzaSyBamJPyOALkoj5NyFWDMnpxijkK7iT5FHM",
  authDomain: "drivehive-dbe9b.firebaseapp.com",
  databaseURL: "https://drivehive-dbe9b-default-rtdb.firebaseio.com",
  projectId: "drivehive-dbe9b",
  storageBucket: "drivehive-dbe9b.firebasestorage.app",
  messagingSenderId: "582305437761",
  appId: "1:582305437761:web:0cd72a831664da4b018ec0",
  measurementId: "G-YQ7H98NGVQ"
};
// ✅ Initialize Firebase App
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// ✅ Export Firebase modules for other files
export { auth, database };