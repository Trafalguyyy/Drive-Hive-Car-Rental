import { auth, database } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, set, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Sidebar Navigation
document.addEventListener("DOMContentLoaded", () => {
    ["dashboard", "track-cars", "bookings", "cars", "users", "settings"].forEach(id => {
        document.getElementById(id).addEventListener("click", () => {
            window.location.href = id + ".html";
        });
    });

    // Load and display current payment details
    loadCurrentPaymentDetails();
});

// Form Submission Event for Adding Admin
document.getElementById("adminForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("adminEmail").value;
    const password = document.getElementById("adminPassword").value;
    const message = document.getElementById("adminMessage");

    try {
        // Create new admin user in Firebase Auth
        await createUserWithEmailAndPassword(auth, email, password);
        message.textContent = "✅ New admin added successfully!";
        message.style.color = "green";
        document.getElementById("adminForm").reset();
    } catch (error) {
        console.error("Error adding admin:", error.message);
        message.textContent = "❌ Failed to add admin: " + error.message;
        message.style.color = "red";
    }
});

// Form Submission Event for Payment Details
document.getElementById("paymentForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const recipientName = document.getElementById("recipientName").value;
    const recipientAccount = document.getElementById("recipientAccount").value;
    const qrCodeImage = document.getElementById("qrCodeImage").files[0];
    const message = document.getElementById("paymentMessage");

    try {
        // Convert the image file to a base64 string
        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64Image = event.target.result;

            // Save payment details to Firebase Realtime Database
            await set(ref(database, "payment_details"), {
                recipientName,
                recipientAccount,
                qrCodeUrl: base64Image
            });

            message.textContent = "✅ Payment details saved successfully!";
            message.style.color = "green";
            document.getElementById("paymentForm").reset();

            // Reload and display the updated payment details
            loadCurrentPaymentDetails();
        };
        reader.readAsDataURL(qrCodeImage);
    } catch (error) {
        console.error("Error saving payment details:", error.message);
        message.textContent = "❌ Failed to save payment details: " + error.message;
        message.style.color = "red";
    }
});

// Function to Load and Display Current Payment Details
async function loadCurrentPaymentDetails() {
    const paymentDetailsRef = ref(database, "payment_details");
    const snapshot = await get(paymentDetailsRef);

    if (snapshot.exists()) {
        const paymentDetails = snapshot.val();
        document.getElementById("currentRecipientName").textContent = paymentDetails.recipientName || "N/A";
        document.getElementById("currentRecipientAccount").textContent = paymentDetails.recipientAccount || "N/A";

        const qrCodeImage = document.getElementById("currentQrCodeImage");
        if (paymentDetails.qrCodeUrl) {
            qrCodeImage.src = paymentDetails.qrCodeUrl;
            qrCodeImage.style.display = "block";
        } else {
            qrCodeImage.style.display = "none";
        }
    } else {
        console.log("No payment details found.");
    }
}