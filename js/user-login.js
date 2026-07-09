// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// DOM Elements
const formTitle = document.getElementById('form-title');
const authForm = document.getElementById('authForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const submitBtn = document.getElementById('submit-btn');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');

const signupFields = document.getElementById('signup-fields');
const firstNameInput = document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const numberInput = document.getElementById('number');
const licenseNumberInput = document.getElementById('licenseNumber');
const pictureInput = document.getElementById('picture');
const licenseInput = document.getElementById('license');
const uploadPictureBtn = document.getElementById('upload-picture-btn');
const uploadLicenseBtn = document.getElementById('upload-license-btn');

let pictureFile = null;
let licenseFile = null;

// Get modal elements
const messageModal = document.getElementById('message-modal');
const messageText = document.getElementById('message-text');
const closeModalBtn = document.getElementById('close-modal');
const loadingModal = document.getElementById('loading-modal');
const loadingText = document.getElementById('loading-text');

// Car Modal Elements
const carModal = document.getElementById('carModal');
const carModalContent = document.getElementById('carModalContent');
const bookNowBtn = document.getElementById('bookNowBtn');
const closeCarModal = document.querySelector('.close-car-modal');

// Initialize modals
if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
        messageModal.style.display = "none";
    });
}

if (closeCarModal) {
    closeCarModal.addEventListener('click', () => {
        carModal.style.display = 'none';
    });
}

if (bookNowBtn) {
    bookNowBtn.addEventListener('click', () => {
        carModal.style.display = 'none';
        window.location.href = '#home';
    });
}

// Toggle Between Login & Sign Up
let isLogin = true;

loginBtn.addEventListener('click', () => toggleForm(true));
signupBtn.addEventListener('click', () => toggleForm(false));
// Make sure these elements exist before adding event listeners
if (messageModal && closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
        messageModal.style.display = "none";
    });
    
    // Close when clicking outside
    messageModal.addEventListener('click', (e) => {
        if (e.target === messageModal) {
            messageModal.style.display = "none";
        }
    });
}
function toggleForm(loginMode) {
    isLogin = loginMode;
    formTitle.innerText = loginMode ? "User Login" : "User Sign Up";
    submitBtn.innerText = loginMode ? "Log In" : "Sign Up";
    loginBtn.classList.toggle("active", loginMode);
    signupBtn.classList.toggle("active", !loginMode);
    
    // Handle signup fields
    if (loginMode) {
        signupFields.style.display = 'none';
        // Clear all required attributes
        Array.from(signupFields.querySelectorAll('input')).forEach(input => {
            input.removeAttribute('required');
        });
        
        // Clear signup fields
        authForm.reset();
        pictureFile = null;
        licenseFile = null;
        uploadPictureBtn.textContent = "Upload Profile Picture";
        uploadLicenseBtn.textContent = "Upload License";
    } else {
        signupFields.style.display = 'block';
        // Set required only for visible non-file inputs
        Array.from(signupFields.querySelectorAll('input:not([type="file"])')).forEach(input => {
            input.setAttribute('required', '');
        });
    }
}

// File Upload Handlers
uploadPictureBtn.addEventListener('click', () => pictureInput.click());
uploadLicenseBtn.addEventListener('click', () => licenseInput.click());

pictureInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        pictureFile = e.target.files[0];
        uploadPictureBtn.textContent = "Picture Selected";
        convertToBase64(pictureFile).then(base64 => {
            pictureFile.base64 = base64;
        });
    }
});

licenseInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        licenseFile = e.target.files[0];
        uploadLicenseBtn.textContent = "License Selected";
        convertToBase64(licenseFile).then(base64 => {
            licenseFile.base64 = base64;
        });
    }
});

// Function to convert file to base64
function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Show pop-up modal
// function showModal(message) {
//     if (messageModal && messageText) {
//         messageText.innerText = message;
//         messageModal.style.display = "flex"; // Changed to flex
//     } else {
//         alert(message); // Fallback
//     }
// }
function showModal(message, isPersistent = false) {
    if (messageModal && messageText) {
        messageText.innerHTML = message + (isPersistent ? '' : '<div class="loading-spinner"></div>');
        messageModal.style.display = "flex";
    } else {
        alert(message);
    }
}
function showLoading(message = "Creating your account...") {
    if (loadingModal && loadingText) {
        loadingText.textContent = message;
        loadingModal.style.display = "flex";
    }
}
function hideLoading() {
    if (loadingModal) {
        loadingModal.style.display = "none";
    }
}

// Generate UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Form Submission (Login or Sign Up)
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        showModal("Email and password cannot be empty!");
        return;
    }

    if (!isValidEmail(email)) {
        showModal("Invalid email format!");
        return;
    }

    if (password.length < 6) {
        showModal("Password must be at least 6 characters long!");
        return;
    }

    const userKey = email.replace(/\./g, '_');
    const userRef = ref(db, 'users/' + userKey);

        if (isLogin) {
            get(userRef)
                .then((snapshot) => {
                    if (snapshot.exists()) {
                        const userData = snapshot.val();
                        if (userData.password === password) {
                            if (!userData.isVerified) {
                                showModal("Your account is pending verification. Please wait for admin approval.");
                                return;
                            }
                            
                            localStorage.setItem("loggedInUser", JSON.stringify({ 
                                email: email, 
                                userId: userData.userId,
                                isVerified: userData.isVerified
                            }));
                        
        
                            showModal("Login successful! Redirecting...");
                            setTimeout(() => window.location.href = "user-dashboard.html", 1500);
                        } else {
                            showModal("Incorrect email or password!");
                        }
                    } else {
                        showModal("User not found!");
                    }
                })
                .catch((error) => {
                    showModal("Error logging in. Try again later.");
                    console.error(error);
                });
                // Modify your sign-up handler to:
            } else {
            const firstName = firstNameInput.value.trim();
            const lastName = lastNameInput.value.trim();
            const number = numberInput.value.trim();
            const licenseNumber = licenseNumberInput.value.trim();
        
            if (!firstName || !lastName || !number || !licenseNumber) {
                showModal("All fields are required!");
                return;
            }
        
            if (!pictureFile || !licenseFile) {
                showModal("Please upload both profile picture and license!");
                return;
            }
        
            // Show loading modal and disable form
            showLoading();
            submitBtn.disabled = true;
            authForm.style.opacity = "0.5";
            authForm.style.pointerEvents = "none";
        
            // Process files in parallel
            Promise.all([
                convertToBase64(pictureFile),
                convertToBase64(licenseFile)
            ]).then(([pictureBase64, licenseBase64]) => {
                loadingText.textContent = "Saving your data...";
                return get(userRef).then((snapshot) => {
                    if (snapshot.exists()) {
                        throw new Error("Email already registered");
                    }
        
                    return set(userRef, {
                        email: email,
                        password: password,
                        firstName: firstName,
                        lastName: lastName,
                        number: number,
                        picture: pictureBase64,
                        license: licenseBase64,
                        licenseNumber: licenseNumber,
                        userId: generateUUID(),
                        isVerified: false
                    });
                });
            }).then(() => {
                hideLoading();
                showModal("Account created! Admin will verify your account.", true);
                toggleForm(true);
            }).catch((error) => {
                hideLoading();
                showModal(error.message || "Error signing up. Try again later.", true);
                console.error(error);
            }).finally(() => {
                submitBtn.disabled = false;
                authForm.style.opacity = "1";
                authForm.style.pointerEvents = "auto";
            });
        }
    // } else {
    //     const firstName = firstNameInput.value.trim();
    //     const lastName = lastNameInput.value.trim();
    //     const number = numberInput.value.trim();
    //     const licenseNumber = licenseNumberInput.value.trim();

    //     if (!firstName || !lastName || !number || !licenseNumber) {
    //         showModal("All fields are required!");
    //         return;
    //     }

    //     // Manual file validation (replaces HTML5 validation)
    //     if (!pictureFile || !licenseFile) {
    //         showModal("Please upload both profile picture and license!");
    //         return;
    //     }

    //     get(userRef).then((snapshot) => {
    //         if (snapshot.exists()) {
    //             showModal("Email is already registered!");
    //         } else {
    //             const userId = generateUUID();
    //             set(userRef, {
    //                 email: email,
    //                 password: password,
    //                 firstName: firstName,
    //                 lastName: lastName,
    //                 number: number,
    //                 picture: pictureFile.base64,
    //                 license: licenseFile.base64,
    //                 licenseNumber: licenseNumber,
    //                 userId: userId,
    //                 isVerified: false
    //             })
    //             .then(() => {
    //                 showModal("Account created! Admin will verify your account.");
    //                 toggleForm(true);
    //             })
    //             .catch((error) => {
    //                 showModal("Error signing up. Try again later.");
    //                 console.error(error);
    //             });

                

    //         }
    //     });
    // }
});

// Email Validation Function
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Car Functions
function loadCars() {
    const carsRef = ref(db, 'cars');
    get(carsRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                const carsData = snapshot.val();
                displayCars(carsData);
            } else {
                console.log("No cars available");
            }
        })
        .catch((error) => {
            console.error("Error loading cars:", error);
        });
}

function displayCars(carsData) {
    const carsGrid = document.getElementById('carsGrid');
    carsGrid.innerHTML = '';
    
    Object.entries(carsData).forEach(([key, car]) => {
        if (car.status !== "disabled") {
            const carCard = document.createElement('div');
            carCard.className = 'car-card';
            carCard.innerHTML = `
                <img src="${car.image}" alt="${car.carName}" class="car-image">
                <div class="car-info">
                    <div class="car-name">${car.carName}</div>
                    <div class="car-price">${car.rentalPrice}</div>
                </div>
            `;
            carCard.addEventListener('click', () => openCarModal(car));
            carsGrid.appendChild(carCard);
        }
    });
}

function openCarModal(car) {
    carModalContent.innerHTML = `
        <div class="car-modal-container">
            <div class="car-modal-left">
                <h3 class="car-modal-title">${car.carName}</h3>
                <p class="car-modal-detail"><strong>Model:</strong> ${car.carModel}</p>
                <p class="car-modal-detail"><strong>Year:</strong> ${car.carYear}</p>
                <p class="car-modal-detail"><strong>Seats:</strong> ${car.numSeats}</p>
                <p class="car-modal-detail"><strong>License Plate:</strong> ${car.licensePlate}</p>
                <p class="car-modal-detail"><strong>Price:</strong> ${car.rentalPrice}</p>
                <p class="car-modal-detail"><strong>Description:</strong> ${car.description}</p>
                <button id="bookNowBtn">Book Now</button>
            </div>
            <div class="car-modal-right">
                <img src="${car.image}" alt="${car.carName}" class="car-modal-image">
            </div>
        </div>
    `;
    
    carModal.style.display = 'block';
    
    // Add new event listener for the dynamically created button
    document.getElementById('bookNowBtn').addEventListener('click', () => {
        carModal.style.display = 'none';
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Initialize cars when page loads
window.addEventListener('DOMContentLoaded', loadCars);