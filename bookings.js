import { database } from "./firebase-config.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Fetch and display bookings with billing information
async function fetchAndDisplayBookings() {
    try {
        // Fetch bookings and bills in parallel
        const [bookingsSnapshot, billsSnapshot] = await Promise.all([
            get(ref(database, 'bookings_history')),
            get(ref(database, 'Bills'))
        ]);

        const tableBody = document.getElementById('bookingsTableBody');
        tableBody.innerHTML = ''; // Clear loading message

        if (!bookingsSnapshot.exists()) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-data">No bookings found</td>
                </tr>
            `;
            return;
        }

        // Create a map of bills by userId for quick lookup
        const billsMap = {};
        if (billsSnapshot.exists()) {
            billsSnapshot.forEach(billSnapshot => {
                const bill = billSnapshot.val();
                billsMap[bill.userId] = {
                    finalFee: bill.finalFee || '0',
                    timestamp: bill.timestamp || ''
                };
            });
        }

        const bookings = [];
        bookingsSnapshot.forEach((childSnapshot) => {
            const booking = childSnapshot.val();
            const userBill = billsMap[booking.userId] || {};
            
            bookings.push({
                id: childSnapshot.key,
                name: booking.fullName || 'Unknown',
                car: booking.car?.carName || 'Unknown',
                price: booking.car?.rentalPrice || '0',
                date: booking.bookingDate || 'Unknown date',
                destination: booking.toLocation || 'Not specified',
                finalFee: userBill.finalFee || 'Not billed yet',
                userId: booking.userId
            });
        });

        // Sort by date (newest first)
        bookings.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Display bookings in table
        bookings.forEach(booking => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${booking.name}</td>
                <td>${booking.car}</td>
                <td>₱${booking.price}</td>
                <td>${formatDate(booking.date)}</td>
                <td>${booking.destination}</td>
                <td>${booking.finalFee === 'Not billed yet' ? 
                    booking.finalFee : 
                    `₱${booking.finalFee}`}</td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error fetching bookings:", error);
        document.getElementById('bookingsTableBody').innerHTML = `
            <tr>
                <td colspan="6" class="no-data">Error loading bookings</td>
            </tr>
        `;
    }
}

// Format date to readable format
function formatDate(dateString) {
    if (!dateString) return 'Unknown date';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Set active navigation
    document.getElementById('bookings').classList.add('active');
    
    // Fetch and display bookings
    fetchAndDisplayBookings();
    
    // Navigation event listeners
    document.getElementById('dashboard').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
    
    document.getElementById('track-cars').addEventListener('click', () => {
        window.location.href = 'track-cars.html';
    });
    
    document.getElementById('cars').addEventListener('click', () => {
        window.location.href = 'cars.html';
    });

    document.getElementById('users').addEventListener('click', () => {
        window.location.href = 'users.html';
    });
    document.getElementById('settings').addEventListener('click', () => {
        window.location.href = 'settings.html';
    });
});