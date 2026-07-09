import { auth, database } from "./firebase-config.js";
import { ref, get, update, remove, push, orderByChild, equalTo, onValue, query, onChildAdded } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
// Notification system
let notifications = [];
let unreadCount = 0;
let messages = [];
let unreadMessageCount = 0;

function setupNotificationModal() {
      // Debugging: Check if elements are found
      
  
    const notifBtn = document.querySelector('.notif-btn');
    const notificationModal = document.querySelector('.notification-modal');
    const notificationCount = document.querySelector('.notification-count');
    const markReadBtn = document.querySelector('.mark-read-btn');
    const notificationList = document.querySelector('.notification-list');

    const messageBtn = document.querySelector('.message-btn');
    const messageView = document.querySelector('.messages-view');
    const messageCount = document.querySelector('.message-count');
    const conversationList = document.querySelector('.conversation-list');

    
    const messageDetail = document.querySelector('.message-detail');
    const messageContent = document.querySelector('.message-content');
    const messageOverlay = document.createElement('div');
    messageOverlay.className = 'messages-overlay';

    document.body.appendChild(messageOverlay);
    // Toggle modal
    notifBtn.addEventListener('click', () => {
        notificationModal.classList.add('show');
    });
    
    messageBtn.addEventListener('click', () => {
        messageView.style.display = messageView.style.display === 'none' ? 'block' : 'none';
    });



    const savedMessages = localStorage.getItem('messages');
    if (savedMessages) {
        messages = JSON.parse(savedMessages);
        unreadMessageCount = messages.filter(msg => !msg.read).length;
        updateMessageUI();
    }


    const adminNotificationsRef = ref(database, 'admin_notifications');
    let initialLoadComplete = false;
    
    // Initial load of existing notifications
    onValue(adminNotificationsRef, (snapshot) => {
        if (snapshot.exists()) {
            messages = []; // Clear existing messages
            
            snapshot.forEach(childSnapshot => {
                const notification = childSnapshot.val();
                
                if (notification.type === "location_exceeded") {
                    messages.push({
                        id: childSnapshot.key,
                        userId: notification.userId,
                        userName: notification.userName,
                        carName: notification.carName,
                        bookingId: notification.bookingId,
                        distance: notification.distanceBeyond,
                        originalToLocation: notification.originalToLocation,

                        currentLocation: notification.currentLocation,
                        message: `${notification.userName}'s vehicle (${notification.carName}) has exceeded the allowed distance by ${notification.distanceBeyond} km from ${notification.originalToLocation}`,
                        timestamp: notification.timestamp,
                        read: notification.status === "read" || false,
                        status: notification.status || "unread"
                        
                    });
                }
            });
            
            initialLoadComplete = true;
            updateMessageUI();
            localStorage.setItem('messages', JSON.stringify(messages));
        }
    });
    
    // Listen for new notifications
    onChildAdded(adminNotificationsRef, (snapshot) => {
        if (!initialLoadComplete) return;
        
        const notification = snapshot.val();
        
        if (notification.type === "location_exceeded") {
            const exists = messages.some(msg => msg.id === snapshot.key);
            
            if (!exists) {
                const newMessage = {
                    id: snapshot.key,
                    userId: notification.userId,
                    userName: notification.userName,
                    carName: notification.carName,
                    bookingId: notification.bookingId,
                    distance: notification.distanceBeyond,
                    originalTolocation: notification.originalTolocation,
                    currentLocation: notification.currentLocation,
                    message: `${notification.userName}'s vehicle (${notification.carName}) has exceeded the allowed distance by ${notification.distanceBeyond} km from ${notification.originalTolocation}`,
                    timestamp: notification.timestamp,
                    read: false,
                    status: "unread"
                };
                
                messages.unshift(newMessage);
                unreadMessageCount++;
                updateMessageUI();
                localStorage.setItem('messages', JSON.stringify(messages));
                
                // Mark as notified in Firebase
                update(ref(database, `admin_notifications/${snapshot.key}`), { notified: true });
            }
        }
    });
    
    function updateMessageUI() {
        // Recalculate unread count
        unreadMessageCount = messages.filter(msg => !msg.read).length;
        
        // Update count display
        messageCount.textContent = unreadMessageCount;
        messageCount.style.display = unreadMessageCount > 0 ? 'flex' : 'none';
        
        // Sort messages by timestamp (newest first)
        messages.sort((a, b) => b.timestamp - a.timestamp);
        
        // Update conversation list
        if (messages.length === 0) {
            conversationList.innerHTML = '<div class="empty-notice">No messages</div>';
            return;
        }
        
        conversationList.innerHTML = '';
        messages.forEach(msg => {
            const messageDate = new Date(msg.timestamp);
            const options = { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true
            };
            
            const dateTimeString = messageDate.toLocaleString('en-US', options);
            
            const messageElement = document.createElement('div');
            messageElement.className = `conversation-item ${msg.read ? '' : 'unread'}`;
            messageElement.innerHTML = `
                <div class="conversation-summary">
                    <span class="user-name">${msg.userName}</span>
                    <span class="message-preview">${msg.message.substring(0, 50)}...</span>
                </div>
                <div class="conversation-time">${dateTimeString}</div>
            `;
            
            messageElement.addEventListener('click', () => {
                if (!msg.read) {
                    // Update Firebase first
                    update(ref(database, `admin_notifications/${msg.id}`), { 
                        status: "read",
                        notified: true 
                    }).then(() => {
                        // Then update local state
                        msg.read = true;
                        msg.status = "read";
                        unreadMessageCount--;
                        updateMessageUI();
                        localStorage.setItem('messages', JSON.stringify(messages));
                    });
                }
                
                showMessageDetails(msg);
            });
            
            conversationList.appendChild(messageElement);
        });
    } // End of updateMessageUI function
    function showMessageDetails(message) {
        const messageHeader = document.querySelector('.message-header');
        const messageContent = document.querySelector('.message-content');
        
        // Update header
        messageHeader.querySelector('.user-name').textContent = message.userName;
        messageHeader.querySelector('.user-status').textContent = `Booking ID: ${message.bookingId}`;
        
        // Create detailed message content
        messageContent.innerHTML = `
            <div class="message-detail-item">
                <h4>Vehicle Information</h4>
                <p>Car: ${message.carName}</p>
                <p>Booking ID: ${message.bookingId}</p>
            </div>
            <div class="message-detail-item">
                <h4>Location Alert</h4>
                <p>${message.message}</p>
              
                <p>Current Location: ${message.currentLocation}</p>
                <p>Distance Exceeded: ${message.distance} km</p>
            </div>
            <div class="message-actions">
                <button class="btn-primary" onclick="handleMessageAction('contact', '${message.userId}')">
                    <i class=""></i> Track Car
                </button>
            
            </div>
        `;
    } // End of showMessageDetails function
    // Close modal when clicking outside
    notificationModal.addEventListener('click', (e) => {
        if (e.target === notificationModal) {
            notificationModal.classList.remove('show');
        }
    });
    
    // Mark all as read
    markReadBtn.addEventListener('click', () => {
        notifications = notifications.map(notif => ({ ...notif, read: true }));
        unreadCount = 0;
        updateNotificationUI();
        // Store in localStorage to persist read state
        localStorage.setItem('notifications', JSON.stringify(notifications));
    });
    
    // Load notifications from localStorage if available
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
        notifications = JSON.parse(savedNotifications);
        unreadCount = notifications.filter(notif => !notif.read).length;
        updateNotificationUI();
    }
    
    // Listen for new bookings
    const bookingsRef = ref(database, 'bookings');
    onChildAdded(bookingsRef, (snapshot) => {
        const booking = snapshot.val();
        const bookingDate = booking.bookingDate ? new Date(booking.bookingDate) : new Date();
        
        // Check if this booking already exists in notifications
        const exists = notifications.some(notif => notif.id === snapshot.key);
        if (!exists) {
            const newNotification = {
                id: snapshot.key,
                message: `New booking from ${booking.fullName || 'a customer'}`,
                timestamp: bookingDate.getTime(),
                read: false
            };
            
            notifications.unshift(newNotification);
            unreadCount++;
            updateNotificationUI();
            // Save to localStorage
            localStorage.setItem('notifications', JSON.stringify(notifications));
        }
    });
    
    // Initial load of existing bookings
    onValue(bookingsRef, (snapshot) => {
        if (snapshot.exists()) {
            // Only add new bookings that aren't already in notifications
            snapshot.forEach(childSnapshot => {
                const booking = childSnapshot.val();
                const exists = notifications.some(notif => notif.id === childSnapshot.key);
                
                if (!exists) {
                    const bookingDate = booking.bookingDate ? new Date(booking.bookingDate) : new Date();
                    notifications.push({
                        id: childSnapshot.key,
                        message: `Booking from ${booking.fullName || 'a customer'}`,
                        timestamp: bookingDate.getTime(),
                        read: true // Existing bookings are marked as read by default
                    });
                }
            });
            
            updateNotificationUI();
            localStorage.setItem('notifications', JSON.stringify(notifications));
        }
    });
}
/////////////////////////////////////////////////////////

function updateNotificationUI() {
    const notificationList = document.querySelector('.notification-list');
    const notificationCount = document.querySelector('.notification-count');
    
    // Update count
    notificationCount.textContent = unreadCount;
    notificationCount.style.display = unreadCount > 0 ? 'flex' : 'none';
    
    // Sort notifications by timestamp (newest first)
    notifications.sort((a, b) => b.timestamp - a.timestamp);
    
    // Update notification list
    if (notifications.length === 0) {
        notificationList.innerHTML = '<div class="empty-notice">No notifications</div>';
        return;
    }
    
    notificationList.innerHTML = '';
    notifications.forEach(notif => {
        const notificationDate = new Date(notif.timestamp);
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true
        };
        
        const dateTimeString = notificationDate.toLocaleString('en-US', options);
        
        const notifElement = document.createElement('div');
        notifElement.className = `notification-item ${notif.read ? '' : 'unread'}`;
        notifElement.innerHTML = `
            <div class="notification-message">${notif.message}</div>
            <div class="notification-time">${dateTimeString}</div>
        `;
        
        notificationList.appendChild(notifElement);
    });
}

// Call this in your DOMContentLoaded event listener
document.addEventListener("DOMContentLoaded", () => {
    fetchData();
    setupNotificationModal();
    preventBackNavigation();
    
    // ... rest of your existing event listeners ...
});
// ✅ Logout function with confirmation modal
export function logout() {
    showModal("Confirm Logout", "Are you sure you want to log out?", () => {
        auth.signOut()
            .then(() => {
                sessionStorage.clear();
                localStorage.clear();
                window.location.href = "index.html"; // Redirect to login page
            })
            .catch(error => {
                console.error("Logout Error:", error);
            });
    });
}

// ✅ Prevent Back Navigation after Logout
function preventBackNavigation() {
    history.pushState(null, null, location.href);
    window.onpopstate = function () {
        history.go(1);
    };
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("dashboard").addEventListener("click", () => {
        window.location.href = "dashboard.html";
    });

    document.getElementById("track-cars").addEventListener("click", () => {
        window.location.href = "track-cars.html";
    });

    document.getElementById("bookings").addEventListener("click", () => {
        window.location.href = "bookings.html";
    });

    document.getElementById("cars").addEventListener("click", () => {
        window.location.href = "cars.html";
    });

    document.getElementById("users").addEventListener("click", () => {
        window.location.href = "users.html";
    });
    document.getElementById("settings").addEventListener("click", () => {
        window.location.href = "settings.html";
    });
});

// ✅ Fetch Dashboard Data
function fetchData() {
    console.log("Fetching dashboard data...");

    // 🔹 Fetch Total Bookings
    get(ref(database, "bookings"))
        .then((snapshot) => {
            if (snapshot.exists()) {
                let totalBookings = snapshot.size;
                document.getElementById("totalBookings").querySelector("p").innerText = totalBookings;
            } else {
                console.log("No bookings found in the database.");
            }
        }).catch(error => console.error("Error fetching bookings:", error));

    // 🔹 Fetch Total Cars
    get(ref(database, "cars"))
        .then((snapshot) => {
            if (snapshot.exists()) {
                let totalCars = snapshot.size;
                document.getElementById("totalCars").querySelector("p").innerText = totalCars;
            } else {
                console.log("No cars found in the database.");
            }
        }).catch(error => console.error("Error fetching cars:", error));

    // 🔹 Fetch Total Chats
    get(ref(database, "admin_notifications"))
        .then((snapshot) => {
            if (snapshot.exists()) {
                let totalChats = snapshot.size;
                document.getElementById("totalChats").querySelector("p").innerText = totalChats;
            } else {
                console.log("No chats found in the database.");
            }
        }).catch(error => console.error("Error fetching chats:", error));

    // 🔹 Fetch Upcoming Bookings
    get(ref(database, "bookings"))
        .then((snapshot) => {
            console.log("All Bookings Snapshot:", snapshot.val()); // Debugging log
            let table = document.getElementById("upcomingBookings");
            table.innerHTML = "";
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    let data = childSnapshot.val();
                    console.log("Booking Data:", data); // Debugging log

                    // Access nested car object
                    const car = data.car || {}; // Fallback to empty object if car is undefined
                    const carName = car.carName || "N/A";
                    const carModel = car.carModel || "N/A";
                    const rentalPrice = car.rentalPrice || "N/A";

                    // Filter bookings where status is "upcoming"
                    if (data.status === "upcoming") {
                        // Store fromLocation in a data attribute
                        let row = `<tr data-from-location="${data.fromLocation || "N/A"}">
                            <td>${data.fullName}</td>
                            <td>${carName}</td>
                            <td>${carModel}</td>
                            <td>${rentalPrice}</td>
                            <td>${data.toLocation}</td>
                            <td>${data.bookingDate}</td>
                            <td><button class="btn-primary" onclick="markAsActive('${childSnapshot.key}', this)">Mark Active</button></td>
                        </tr>`;
                        table.innerHTML += row;
                    }
                });
            } else {
                console.log("No bookings found."); // Debugging log
            }
        }).catch(error => console.error("Error fetching bookings:", error));

    // 🔹 Fetch Active Bookings
    get(ref(database, "active-bookings"))
        .then((snapshot) => {
            console.log("Active Bookings Snapshot:", snapshot.val()); // Debugging log
            let table = document.getElementById("activeBookings");
            table.innerHTML = "";
            if (snapshot.exists()) {
                Object.entries(snapshot.val()).forEach(([id, data]) => {
                    console.log("Active Booking Data:", data); // Debugging log

                    // Access nested car object
                    const car = data.car || {}; // Fallback to empty object if car is undefined
                    const carName = car.carName || "N/A";
                    const carModel = car.carModel || "N/A";
                    const rentalPrice = car.rentalPrice || "N/A";

                    let row = `<tr>
                        <td>${data.fullName}</td>
                        <td>${carName}</td>
                        <td>${carModel}</td>
                        <td>${rentalPrice}</td>
                        <td>${data.toLocation}</td>
                        <td>${data.bookingDate}</td>
                        <td><button class="btn-danger" onclick="markAsReturned('${id}', '${data.fullName}', '${carName}', '${rentalPrice}')">Returned</button></td>
                    </tr>`;
                    table.innerHTML += row;
                });
            } else {
                console.log("No active bookings found."); // Debugging log
            }
        }).catch(error => console.error("Error fetching active bookings:", error));
}

// ✅ Mark Booking as Active (updated to include booking_status)
window.markAsActive = function (bookingId, buttonElement) {
    // Get the row containing the button
    const row = buttonElement.closest("tr");

    // Get the fromLocation from the data attribute
    const fromLocation = row.getAttribute("data-from-location");

    // Fetch the booking data
    get(ref(database, `bookings/${bookingId}`))
        .then((snapshot) => {
            if (snapshot.exists()) {
                const bookingData = snapshot.val();

                // Add fromLocation to the booking data
                bookingData.fromLocation = fromLocation;

                // Update the status to "active" and add booking_status
                bookingData.status = "active";
                bookingData.booking_status = "confirmed"; // Add this new field

                // Fetch existing active bookings to determine the next ID
                get(ref(database, "active-bookings"))
                    .then((activeBookingsSnapshot) => {
                        let nextId = 1; // Default ID if no active bookings exist

                        if (activeBookingsSnapshot.exists()) {
                            // Find the highest existing ID
                            const activeBookings = activeBookingsSnapshot.val();
                            const existingIds = Object.keys(activeBookings).map((id) => {
                                return parseInt(id.replace("active_booking", ""), 10);
                            });
                            nextId = Math.max(...existingIds) + 1; // Increment the highest ID
                        }

                        // Generate the new ID
                        const newId = `active_booking${nextId}`;

                        // Move the booking to active-bookings with the new ID
                        update(ref(database, `active-bookings/${newId}`), bookingData)
                            .then(() => {
                                // Remove the booking from the bookings node
                                remove(ref(database, `bookings/${bookingId}`))
                                    .then(() => {
                                        console.log("Booking moved to active-bookings with ID:", newId);

                                        // Update the car's status to "disabled" in the cars node
                                        const carId = bookingData.car?.id || bookingData.carId; // Adjust based on your structure
                                        if (carId) {
                                            update(ref(database, `cars/${carId}`), { 
                                                status: "disabled",
                                                // Also update booking_status for the car if needed
                                                booking_status: "confirmed" 
                                            })
                                                .then(() => {
                                                    console.log("Car status updated to 'disabled' with confirmed booking status.");
                                                    fetchData(); // Refresh the UI
                                                })
                                                .catch(error => console.error("Error updating car status:", error));
                                        } else {
                                            console.error("Car ID not found in booking data.");
                                            fetchData(); // Refresh the UI
                                        }
                                    })
                                    .catch(error => console.error("Error deleting booking:", error));
                            })
                            .catch(error => console.error("Error moving booking to active-bookings:", error));
                    })
                    .catch(error => console.error("Error fetching active bookings:", error));
            } else {
                console.log("Booking not found.");
            }
        })
        .catch(error => console.error("Error fetching booking data:", error));
};
window.handleMessageAction = function(action, id) {
    if (action === 'contact') {
        // Redirect to track.html with user ID as parameter
        window.location.href = `track-cars.html?userId=${id}`;
    } else if (action === 'track') {
        // Redirect to track.html with booking ID as parameter
        window.location.href = `track.html?bookingId=${id}`;
    }
};

// ✅ Mark Booking as Returned (Move to History)
window.markAsReturned = function (bookingId, fullName, carName, rentalPrice) {
    showModal("Confirm Return", "Has the car been returned?", () => {
        const historyRef = ref(database, "bookings_history");

        // Fetch the active booking data
        get(ref(database, `active-bookings/${bookingId}`))
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const bookingData = snapshot.val();

                    // Move the data to bookings history
                    push(historyRef, bookingData)
                        .then(() => {
                            // Remove from active-bookings
                            remove(ref(database, `active-bookings/${bookingId}`))
                                .then(() => {
                                    console.log("Booking moved to returned-bookings.");

                                    // Update the car's status to "active" in the cars node
                                    const carId = bookingData.car?.id || bookingData.carId; // Adjust based on your structure
                                    if (carId) {
                                        update(ref(database, `cars/${carId}`), { status: "active" })
                                            .then(() => {
                                                console.log("Car status updated to 'active'.");
                                                fetchData(); // Refresh the UI
                                            })
                                            .catch(error => console.error("Error updating car status:", error));
                                    } else {
                                        console.error("Car ID not found in booking data.");
                                        fetchData(); // Refresh the UI
                                    }
                                })
                                .catch(error => console.error("Error deleting active booking:", error));
                        })
                        .catch(error => console.error("Error moving booking to history:", error));
                } else {
                    console.log("Booking not found.");
                }
            })
            .catch(error => console.error("Error fetching active booking:", error));
    });
};

// ✅ Show Modal Function
function showModal(title, message, onConfirm) {
    let modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `
        <div class="modal">
            <h2>${title}</h2>
            <p>${message}</p>
            <div class="modal-actions">
                <button class="btn-cancel" onclick="closeModal()">Cancel</button>
                <button class="btn-confirm" onclick="confirmModal()">Confirm</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // ✅ Confirm Function
    window.confirmModal = function () {
        closeModal();
        onConfirm();
    };

    // ✅ Close Modal
    window.closeModal = function () {
        document.body.removeChild(modal);
    };
 
}

// ✅ Run fetchData when the page loads
document.addEventListener("DOMContentLoaded", fetchData);
//////////////////////////////////////////////////////////////