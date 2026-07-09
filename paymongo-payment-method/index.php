<?php
// Start the session
session_start();

// Get the booking ID from query parameter
$bookingId = isset($_GET['bookingId']) ? $_GET['bookingId'] : '';

// Initialize variables with default values
$defaultAmount = 100;
$carName = 'Your Booking';
$finalFee = $defaultAmount;

$autoComplete = isset($_GET['autoComplete']);

// Firebase configuration
$firebaseUrl = "https://drivehive-dbe9b-default-rtdb.firebaseio.com/bills.json";
$checkExistingUrl = "https://drivehive-dbe9b-default-rtdb.firebaseio.com/bills.json?orderBy=\"bookingId\"&equalTo=\"" . urlencode($bookingId) . "\"";

// HTML and JavaScript output
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js"></script>
    <title>PayMongo Payment</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');

        * {
            margin: 0;
            padding: 0;
            font-family: 'Inter', 'Poppins', sans-serif;    
            box-sizing: border-box;
        }

        body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #0e0e10;
            background-image: radial-gradient(circle at 10% 20%, rgba(229, 57, 53, 0.08) 0%, transparent 40%),
                              radial-gradient(circle at 90% 80%, rgba(229, 57, 53, 0.05) 0%, transparent 40%);
            padding: 24px;
        }

        .container {
            padding: 44px 36px;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            max-width: 440px;
            width: 100%;
            border: 1px solid rgba(255, 255, 255, 0.08);
            animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
        }

        form {
            display: flex;
            flex-direction: column;
            gap: 20px;
            margin-top: 24px;
        }

        h2 {
            font-family: 'Poppins', sans-serif;
            font-size: 1.6rem;
            margin-bottom: 6px;
            color: #ffffff;
            font-weight: 700;
            letter-spacing: -0.5px;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
            text-align: left;
        }

        label {
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.5);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        input {
            font-size: 0.95rem;
            padding: 12px 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            outline: none;
            background-color: rgba(255, 255, 255, 0.04);
            color: #ffffff;
            transition: all 0.2s ease;
            width: 100%;
        }

        input[readonly] {
            color: rgba(255, 255, 255, 0.6);
            border-color: rgba(255, 255, 255, 0.05);
            background-color: rgba(255, 255, 255, 0.02);
            cursor: not-allowed;
        }

        input:not([readonly]):focus {
            border-color: #E53935;
            box-shadow: 0 0 0 3px rgba(229, 57, 53, 0.2);
            background-color: rgba(255, 255, 255, 0.07);
        }

        button {
            font-size: 0.95rem;
            padding: 14px;
            background: #E53935;
            border: none;
            color: #ffffff;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-weight: 600;
            letter-spacing: 0.5px;
            margin-top: 12px;
            width: 100%;
            box-shadow: 0 4px 12px rgba(229, 57, 53, 0.2);
        }

        button:hover {
            background: #d32f2f;
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(229, 57, 53, 0.35);
        }

        button:active {
            transform: translateY(0);
        }

        .note {
            font-size: 0.78rem;
            color: #E53935;
            opacity: 0.9;
            margin-bottom: 12px;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Complete Your Payment</h2>
        <p class="note">Minimum amount: ₱100</p>
        
        <form action="create_payment.php" method="POST">
            <input type="hidden" name="bookingId" id="bookingId" value="<?php echo htmlspecialchars($bookingId); ?>">
          
            <div class="form-group">
                <label for="carName">Car:</label>
                <input type="text" name="carName" id="carName" readonly>
            </div>
            <div class="form-group">
                <label for="amount">Amount (PHP):</label>
                <input type="number" name="amount" id="amount" min="100" required value="<?php echo $defaultAmount; ?>">
            </div>
            <input type="hidden" name="email" id="email">
            <input type="hidden" name="userId" id="userId">
            <input type="hidden" name="carId" id="carId">
            <input type="hidden" name="plateNumber" id="plateNumber">
            <button type="submit">Pay Now</button>
        </form>
    </div>

    <script>
        const firebaseConfig = {
            apiKey: "AIzaSyBamJPyOALkoj5NyFWDMnpxijkK7iT5FHM",
            authDomain: "drivehive-dbe9b.firebaseapp.com",
            databaseURL: "https://drivehive-dbe9b-default-rtdb.firebaseio.com",
            projectId: "drivehive-dbe9b",
            storageBucket: "drivehive-dbe9b.appspot.com",
            messagingSenderId: "582305437761",
            appId: "1:582305437761:web:0cd72a831664da4b018ec0"
        };
        document.addEventListener('DOMContentLoaded', () => {
    loadBookingData();
    
    // Get the form element
    const paymentForm = document.querySelector('form');
    
    // Add submit event listener
    paymentForm.addEventListener('submit', async function(e) {
        e.preventDefault(); // Prevent default form submission
        
        try {
            // Get the current booking data
            const bookingData = {
                bookingId: document.getElementById('bookingId').value,
                carName: document.getElementById('carName').value,
                currentFee: document.getElementById('amount').value,
                email: document.getElementById('email').value,
                userId: document.getElementById('userId').value,
                carId: document.getElementById('carId').value,
                carPlateNumber: document.getElementById('plateNumber').value
            };
            
            // Save to Firebase first
            await saveBookingToFirebase(bookingData);
            
            // Then submit the form to create_payment.php
            this.submit();
            
        } catch (error) {
            console.error('Payment submission failed:', error);
            alert('Failed to process payment. Please try again.');
        }
    });
    
    // Rest of your existing DOMContentLoaded code...
});
        // Initialize Firebase (using compat version)
        const app = firebase.initializeApp(firebaseConfig);
        const database = firebase.database();

        // Try to get booking data from localStorage
        const bookingData = JSON.parse(localStorage.getItem('currentBooking') || '{}');
        const lastsaved = JSON.parse(localStorage.getItem('lastSavedFee') || '{}');
        const defaultAmount = <?php echo $defaultAmount; ?>;
        const autoComplete = <?php echo $autoComplete ? 'true' : 'false'; ?>;
       
        function loadBookingData() {
    // Try multiple sources for the currentFee
    const urlParams = new URLSearchParams(window.location.search);
    const urlFee = urlParams.get('currentFee');
    
    // Get from localStorage
    
    const storedFee = localStorage.getItem('lastSavedFee');
    
    // Debug all potential sources
    console.log('URL currentFee:', urlFee);
    console.log('Stored bookingData:', bookingData);
    console.log('lastSavedFee:', storedFee);

    // Priority: URL param > bookingData > lastSavedFee > default
    const currentFee = urlFee || bookingData.currentFee || storedFee || <?php echo $defaultAmount; ?>;
    
    // Set form values
    document.getElementById('amount').value = currentFee;
    document.getElementById('carName').value = bookingData.carName || 'Your Booking';
    document.getElementById('email').value = bookingData.email || '';
    document.getElementById('userId').value = bookingData.userId || '';
    document.getElementById('carId').value = bookingData.carId || '';
    document.getElementById('plateNumber').value = bookingData.carPlateNumber || '';
    
    console.log('Final currentFee being used:', currentFee);
}

        
// function saveBookingToFirebase(bookingData) {
//     const bookingId = bookingData.bookingId || document.getElementById('bookingId').value;
//     if (!bookingId) {
//         console.error('Cannot save to Firebase: Missing booking ID');
//         return;
//     }
    
//     // Prepare the complete data object with carId
//     const billData = {
//         carName: bookingData.carName || document.getElementById('carName').value,
//         currentFee: bookingData.currentFee || document.getElementById('amount').value, // Changed from finalFee to currentFee
//         email: bookingData.email || document.getElementById('email').value,
//         userId: bookingData.userId || document.getElementById('userId').value,
//         carId: bookingData.carId || document.getElementById('carId').value,
//         plateNumber: bookingData.carPlateNumber || document.getElementById('plateNumber').value,
//         bookingId: bookingId,
//         timestamp: firebase.database.ServerValue.TIMESTAMP,
//         status: 'completed',
//         speed: bookingData.speed || null,
//         distance: bookingData.distance || null,
//         autoSaved: bookingData.autoSaved || false
//     };
    
//     // Check if this booking already exists
//     database.ref('Bills').orderByChild('bookingId').equalTo(bookingId).once('value')
//         .then(snapshot => {
//             if (!snapshot.exists()) {
//                 // Save new bill if it doesn't exist
//                 return database.ref('Bills').push(billData);
//             }
//             console.log('Bill already exists in Firebase');
//             return null;
//         })
//         .then(() => {
//             // Clear localStorage after successful save
//             localStorage.removeItem('currentBooking');
//             localStorage.removeItem('lastSavedFee');
//         })
//         .catch(error => {
//             console.error('Error saving to Firebase:', error);
//         });
// }

        // document.addEventListener('DOMContentLoaded', () => {
        //     loadBookingData();
            
        //     // Show modal if this is an auto-complete redirect
        //     if (autoComplete) {
        //         showModal("Your trip has been automatically completed. Please proceed with payment.");
        //     }
            
        //     // Optional: Periodically check for updates
        //     setInterval(loadBookingData, 10000);
        // });

        function saveBookingToFirebase(bookingData) {
    return new Promise((resolve, reject) => {
        const bookingId = bookingData.bookingId || document.getElementById('bookingId').value;
        if (!bookingId) {
            console.error('Cannot save to Firebase: Missing booking ID');
            reject('Missing booking ID');
            return;
        }
        
        const billData = {
            carName: bookingData.carName || document.getElementById('carName').value,
            currentFee: bookingData.currentFee || document.getElementById('amount').value,
            email: bookingData.email || document.getElementById('email').value,
            userId: bookingData.userId || document.getElementById('userId').value,
            carId: bookingData.carId || document.getElementById('carId').value,
            plateNumber: bookingData.carPlateNumber || document.getElementById('plateNumber').value,
            bookingId: bookingId,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            status: 'completed', // Changed to 'pending' until payment is confirmed
            paymentMethod: 'PayMongo',
            autoSaved: bookingData.autoSaved || false
        };
        
        database.ref('Bills').orderByChild('bookingId').equalTo(bookingId).once('value')
            .then(snapshot => {
                if (!snapshot.exists()) {
                    // Save new bill if it doesn't exist
                    return database.ref('Bills').push(billData);
                }
                console.log('Bill already exists in Firebase - updating instead');
                // Update existing bill if needed
                const billKey = Object.keys(snapshot.val())[0];
                return database.ref('Bills/' + billKey).update(billData);
            })
            .then(() => {
                console.log('Successfully saved to Firebase');
                // Clear localStorage after successful save
                localStorage.removeItem('currentBooking');
                localStorage.removeItem('lastSavedFee');
                resolve();
            })
            .catch(error => {
                console.error('Error saving to Firebase:', error);
                reject(error);
            });
    });
}
        
        function showModal(message, redirectUrl = null) {
            const modal = document.createElement('div');
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
            modal.style.display = 'flex';
            modal.style.justifyContent = 'center';
            modal.style.alignItems = 'center';
            modal.style.zIndex = '1000';
            
            const modalContent = document.createElement('div');
            modalContent.style.backgroundColor = 'white';
            modalContent.style.padding = '20px';
            modalContent.style.borderRadius = '8px';
            modalContent.style.textAlign = 'center';
            
            const messageEl = document.createElement('p');
            messageEl.textContent = message;
            modalContent.appendChild(messageEl);
            
            if (redirectUrl) {
                const okButton = document.createElement('button');
                okButton.textContent = 'OK';
                okButton.style.marginTop = '15px';
                okButton.style.padding = '8px 16px';
                okButton.style.backgroundColor = '#d33f49';
                okButton.style.color = 'white';
                okButton.style.border = 'none';
                okButton.style.borderRadius = '4px';
                okButton.style.cursor = 'pointer';
                okButton.addEventListener('click', () => {
                    window.location.href = redirectUrl;
                });
                modalContent.appendChild(okButton);
            }
            
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
        }
    </script>
</body>
</html>