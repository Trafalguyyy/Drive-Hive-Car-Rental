import { auth, database } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Get modal elements
const errorModal = document.getElementById("errorModal");
const modalMessage = document.getElementById("modal-message");
const closeModal = document.querySelector(".close");

// Show modal function
function showError(message) {
    modalMessage.innerText = message;
    errorModal.style.display = "block";
}

// Close modal when clicking 'X'
closeModal.onclick = function () {
    errorModal.style.display = "none";
};

// Close modal when clicking outside of it
window.onclick = function (event) {
    if (event.target === errorModal) {
        errorModal.style.display = "none";
    }
};

// Email validation function
function isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}

// Sign-Up Function
function signUp() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    // Input validation
    if (!email) {
        showError("Please enter your email.");
        return;
    }
    if (!isValidEmail(email)) {
        showError("Please enter a valid email address.");
        return;
    }
    if (!password) {
        showError("Please enter your password.");
        return;
    }
    if (password.length < 6) {
        showError("Password must be at least 6 characters.");
        return;
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;

            // Store user details in Firebase Realtime Database
            set(ref(database, "users/" + user.uid), {
                email: email,
                createdAt: new Date().toISOString()
            });

            alert("Sign Up Successful! You can now log in.");
        })
        .catch((error) => {
            showError(error.message);
        });
}

// Login Function
function login() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email) {
        showError("Please enter your email.");
        return;
    }
    if (!password) {
        showError("Please enter your password.");
        return;
    }

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            window.location.href = "dashboard.html";
        })
        .catch((error) => {
            if (error.code === "auth/invalid-credential") {
                showError("Incorrect email or password.");
            } else if (error.code === "auth/user-not-found") {
                showError("User not found. Please sign up.");
            } else if (error.code === "auth/invalid-email") {
                showError("Invalid email format.");
            } else {
                showError(error.message);
            }
        });
}


// Attach functions to global scope
window.signUp = signUp;
window.login = login;
