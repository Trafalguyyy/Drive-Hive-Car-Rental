import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, update, get } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

// Firebase configuration
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication

   
    
        document.getElementById("dashboard").addEventListener("click", () => {
            window.location.href = "user-dashboard.html";
        });
      
        document.getElementById("Viewmap").addEventListener("click", () => {
            window.location.href = "index11.html";
        });
        document.getElementById("transhis").addEventListener("click", () => {
            console.log("Navigating to Transaction History"); // Debugging
            window.location.href = "user-dashboard.html";
        });
    
        document.getElementById("notif").addEventListener("click", () => {
            window.location.href = "user-dashboard.html";
        });
    
        document.getElementById("set").addEventListener("click", () => {
            window.location.href = "user-settings.html";
        });
    
        



    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!loggedInUser || !loggedInUser.email) {
        window.location.href = "user-login.html";
        return;
    }

    // Initialize UI state
    const loadingIndicator = document.getElementById('loadingIndicator');
    const userContent = document.getElementById('userContent');
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    if (userContent) userContent.style.display = 'none';

    // Load user data using email from localStorage
    loadUserData(loggedInUser.email);

    // Setup logout
    document.getElementById('logout')?.addEventListener('click', handleLogout);
});

async function loadUserData(email) {
    try {
        // Convert email to Firebase key format (replace . with _)
        const firebaseKey = email.replace(/\./g, '_');
        const userRef = ref(db, `users/${firebaseKey}`);
        const snapshot = await get(userRef);

        if (!snapshot.exists()) {
            throw new Error("User account not found. Please contact support.");
        }

        const userData = snapshot.val();
        
        // Verify the userId matches localStorage (security check)
        const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
        if (userData.userId !== loggedInUser.userId) {
            throw new Error("Authentication mismatch. Please log in again.");
        }

        populateUserData(userData);
        setupEventListeners(firebaseKey); // Use the Firebase key for updates

        // Show content
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('userContent').style.display = 'block';

    } catch (error) {
        console.error("Error loading user data:", error);
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${error.message}`;
        }
        setTimeout(() => window.location.href = "user-login.html", 3000);
    }
}

function populateUserData(userData) {
    // Basic info
    document.getElementById('firstName').value = userData.firstName || '';
    document.getElementById('lastName').value = userData.lastName || '';
    document.getElementById('email').value = userData.email || '';
    document.getElementById('phoneNumber').value = userData.phoneNumber || userData.number || '';
    document.getElementById('licenseNumber').value = userData.licenseNumber || '';

    // Profile header
    document.getElementById('userFullName').textContent = 
        `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'User';
    document.getElementById('userEmail').textContent = userData.email || '';

    // Images
    const profileImg = document.getElementById('userPicture');
    profileImg.src = userData.picture || 'default-avatar.jpg';
    
    const licenseImg = document.getElementById('licenseImagePreview');
    if (userData.license) {
        licenseImg.src = userData.license;
        licenseImg.style.display = 'block';
    } else {
        licenseImg.style.display = 'none';
    }

    // Verification status
    updateVerificationStatus(userData.isVerified);
}

function updateVerificationStatus(isVerified) {
    const verificationBadge = document.querySelector('.verification-badge');
    if (!verificationBadge) return;

    if (isVerified) {
        verificationBadge.innerHTML = `
            <i class="fas fa-check-circle verified-icon"></i>
            <span>Verified Account</span>
        `;
        verificationBadge.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
    } else {
        verificationBadge.innerHTML = `
            <i class="fas fa-times-circle unverified-icon"></i>
            <span>Pending Verification</span>
        `;
        verificationBadge.style.backgroundColor = 'rgba(255, 193, 7, 0.1)';
    }
}

function setupEventListeners(firebaseKey) {
    // Image upload triggers
    document.getElementById('changePictureBtn')?.addEventListener('click', () => {
        document.getElementById('pictureUpload').click();
    });

    document.getElementById('changeLicenseBtn')?.addEventListener('click', () => {
        document.getElementById('licenseUpload').click();
    });

    // Image upload handlers
    document.getElementById('pictureUpload')?.addEventListener('change', (e) => {
        handleImageUpload(e, 'userPicture', 'picture', firebaseKey);
    });

    document.getElementById('licenseUpload')?.addEventListener('change', (e) => {
        handleImageUpload(e, 'licenseImagePreview', 'license', firebaseKey);
    });

    // Form submission
    document.getElementById('userSettingsForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        handleFormSubmit(firebaseKey);
    });
}

async function handleImageUpload(event, elementId, fieldName, firebaseKey) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const imgData = e.target.result;
            document.getElementById(elementId).src = imgData;
            
            if (elementId === 'licenseImagePreview') {
                document.getElementById(elementId).style.display = 'block';
            }

            await update(ref(db, `users/${firebaseKey}`), { [fieldName]: imgData });
        } catch (error) {
            console.error(`Error updating ${fieldName}:`, error);
            alert(`Error updating ${fieldName}: ${error.message}`);
        }
    };
    reader.readAsDataURL(file);
}

async function handleFormSubmit(firebaseKey) {
    try {
        const updates = {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            phoneNumber: document.getElementById('phoneNumber').value.trim(),
            licenseNumber: document.getElementById('licenseNumber').value.trim()
        };

        // Validate required fields
        if (!updates.firstName || !updates.lastName) {
            throw new Error("First name and last name are required");
        }

        await update(ref(db, `users/${firebaseKey}`), updates);
        alert('Profile updated successfully!');
        
        // Update displayed name
        document.getElementById('userFullName').textContent = 
            `${updates.firstName} ${updates.lastName}`;

    } catch (error) {
        console.error('Error updating profile:', error);
        alert(`Error: ${error.message}`);
    }
}

function handleLogout() {
   

    const isConfirmed = confirm("Are you sure you want to log out?");
    if (isConfirmed) {
        localStorage.removeItem("loggedInUser");
        window.location.href = 'user-login.html';
    }
}