import { database } from "./firebase-config.js";
import { ref, get, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Fetch and Display Users
document.addEventListener("DOMContentLoaded", async () => {
    const usersRef = ref(database, "users");
    const snapshot = await get(usersRef);

    if (snapshot.exists()) {
        const users = snapshot.val();
        const usersTable = document.getElementById("usersTable").getElementsByTagName("tbody")[0];
        const totalUsers = document.getElementById("totalUsers");

        let count = 0;

        // Clear existing rows
        usersTable.innerHTML = "";

        // Loop through users and add rows to the table
        for (const userId in users) {
            const user = users[userId];
            const row = usersTable.insertRow();

            // Email cell
            const emailCell = row.insertCell();
            emailCell.textContent = user.email;

            // Phone number cell
            const phoneCell = row.insertCell();
            phoneCell.textContent = user.number || "N/A";

            // Actions cell
            const actionsCell = row.insertCell();
            
            // View ID button
            const viewIdBtn = document.createElement("button");
            viewIdBtn.textContent = "View ID";
            viewIdBtn.className = "action-btn view-btn";
            viewIdBtn.addEventListener("click", () => viewUserID(user));
            
            // Verify button
            const verifyBtn = document.createElement("button");
            verifyBtn.textContent = user.isVerified ? "Verified" : "Verify";
            verifyBtn.className = `action-btn ${user.isVerified ? "verified-btn" : "verify-btn"}`;
            verifyBtn.disabled = user.isVerified;
            verifyBtn.addEventListener("click", () => verifyUser(userId, user));
            
            actionsCell.appendChild(viewIdBtn);
            actionsCell.appendChild(verifyBtn);

            count++;
        }

        // Update total users count
        totalUsers.textContent = count;
    } else {
        console.log("No users found.");
    }
});

// View User ID function - Shows license image (updated with smaller size)
function viewUserID(user) {
    // Create a modal to display the license image
    const modal = document.createElement("div");
    modal.className = "modal";
    
    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";
    
    const closeBtn = document.createElement("span");
    closeBtn.className = "close-btn";
    closeBtn.innerHTML = "&times;";
    closeBtn.addEventListener("click", () => document.body.removeChild(modal));
    
    const title = document.createElement("h3");
    title.textContent = "User License Verification";
    
    const licenseInfo = document.createElement("p");
    const fname = document.createElement("p");
    const lname = document.createElement("p");
    const email = document.createElement("p");
    const number = document.createElement("p");
    licenseInfo.innerHTML = `<strong>License Number:</strong> ${user.licenseNumber}`;
    fname.innerHTML = `<strong>First name:</strong> ${user.firstName}`;
    lname.innerHTML = `<strong>Last name:</strong> ${user.lastName}`;
    number.innerHTML = `<strong>Contact number:</strong> ${user.number}`;
    email.innerHTML = `<strong>email:</strong> ${user.email}`;
    
    
    const licenseImage = document.createElement("img");
    licenseImage.src = user.license;
    licenseImage.alt = "Driver's License";
    licenseImage.className = "license-image";
    licenseImage.style.maxHeight = "300px"; // Explicitly setting smaller size here
    
    modalContent.appendChild(closeBtn);
    modalContent.appendChild(title);
    modalContent.appendChild(licenseInfo);
    modalContent.appendChild(fname);
    modalContent.appendChild(lname);
    modalContent.appendChild(number);
    modalContent.appendChild(email);

    

    modalContent.appendChild(licenseImage);
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Verify User function - Updates isVerified field
async function verifyUser(userId, user) {
    if (user.isVerified) return;
    
    const confirmVerify = confirm(`Are you sure you want to verify ${user.firstName} ${user.lastName}?`);
    
    if (confirmVerify) {
        try {
            // Update the user's isVerified status in the database
            await update(ref(database, `users/${userId}`), {
                isVerified: true
            });
            
            alert("User verified successfully!");
            // Refresh the page to show updated status
            location.reload();
        } catch (error) {
            console.error("Error verifying user:", error);
            alert("Error verifying user. Please try again.");
        }
    }
}

// Sidebar Navigation remains the same
document.addEventListener("DOMContentLoaded", () => {
    ["dashboard", "track-cars", "bookings", "cars", "users", "settings"].forEach(id => {
        document.getElementById(id).addEventListener("click", () => {
            window.location.href = id + ".html";
        });
    });
});