import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";

// Firebase Config
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
document.addEventListener("DOMContentLoaded", () => {
    
    document.getElementById("bookNowBtn").addEventListener("click", () => {
        window.location.href = "book-now.html";
    });
    document.getElementById("dashboard").addEventListener("click", () => {
        window.location.href = "user-dashboard.html";
    });
    document.getElementById("Map").addEventListener("click", () => {
        window.location.href = "index11.html";
    });
    document.getElementById("view-mybooking").addEventListener("click", () => {
        console.log("Navigating to Transaction History"); // Debugging
        window.location.href = "my-bookings.html";
    });

    document.getElementById("view-bookedcar").addEventListener("click", () => {
        window.location.href = "index11.html";
    });

    document.getElementById("set").addEventListener("click", () => {
        window.location.href = "user-settings.html";
    });

    
});
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ✅ Get elements
const usernameDisplay = document.getElementById("username");
const logoutButton = document.getElementById("logout");

// ✅ Retrieve logged-in user from localStorage
const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

if (!loggedInUser || !loggedInUser.email) {
    console.warn("No logged-in user found. Redirecting to login...");
    window.location.href = "user-login.html"; // Redirect if user data is missing
} else {
    const userKey = loggedInUser.email.replace(/\./g, '_'); // Firebase key format

    console.log("Checking user:", userKey);

    get(ref(db, `users/${userKey}`))
        .then((userSnapshot) => {
            if (userSnapshot.exists()) {
                console.log("User found in database:", userSnapshot.val());

                const userData = userSnapshot.val();
                usernameDisplay.innerText = userData.email.split("@")[0]; // Show username
            } else {
                console.warn("User not found in database. Logging out...");
                logout();
            }
        })
        .catch(error => {
            console.error("Error verifying user:", error);
            alert("Error verifying user. Please check your internet connection.");
            logout();
        });
}


// ✅ Logout function (Clears localStorage)
function logout() {
    localStorage.removeItem("loggedInUser");
    alert("Session expired. Please log in again.");
    window.location.href = "user-login.html";
}

// ✅ Logout button event
logoutButton.addEventListener("click", () => {
    if (confirm("Are you sure you want to log out?")) {
        logout();
    }
});


