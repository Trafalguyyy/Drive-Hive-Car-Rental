<?php
// Replace with your PayMongo Secret Key
$secretKey = "sk_test_9g7G5cnJQTpauK3UNDJnjLru";

// Collect form data
$amount = $_POST['amount'] * 100; // Convert to centavo

// Define the data payload for creating a Payment Link
$data = [
    "data" => [
        "attributes" => [
            "amount" => $amount,
            "currency" => "PHP",
            "description" => "RENTAL FEE",
            "remarks" => "Rental fee"
        ]
    ]
];

// Initialize cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://api.paymongo.com/v1/links");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "Authorization: Basic " . base64_encode($secretKey . ":")
]);

// Execute the cURL request
$result = curl_exec($ch);
curl_close($ch);

// Decode the response
$response = json_decode($result, true);

// Check if the Payment Link was created successfully
if (isset($response['data']['attributes']['checkout_url'])) {
    $checkoutUrl = $response['data']['attributes']['checkout_url'];
    $paymentId = $response['data']['id'];
    
    // Generate the QR code URL
    $qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" . urlencode($checkoutUrl);
    
    // Display HTML page with QR code
    echo '<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GCash Payment</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                flex-direction: column;
                background-color: #f5f5f5;
            }
            .payment-container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                text-align: center;
                max-width: 400px;
                width: 100%;
            }
            .qr-code {
                margin: 20px 0;
                border: 1px solid #eee;
                padding: 10px;
                background: white;
            }
            .instructions {
                margin-top: 20px;
                text-align: left;
                font-size: 14px;
                color: #555;
            }
            .amount {
                font-size: 24px;
                font-weight: bold;
                color: #00a859; /* GCash green */
                margin: 10px 0;
            }
            .btn {
                display: inline-block;
                margin-top: 20px;
                padding: 10px 20px;
                background-color: #00a859;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="payment-container">
            <h2>Pay with GCash</h2>
            <div class="amount">₱'.number_format($amount/100, 2).'</div>
            
            <div class="qr-code">
                <img src="'.$qrCodeUrl.'" alt="GCash QR Code">
            </div>
            
            <a href="'.$checkoutUrl.'" class="btn" target="_blank">Open Payment Page</a>
            
            <div class="instructions">
                <h3>How to Pay:</h3>
                <ol>
                    <li>Open GCash app on your phone</li>
                    <li>Tap "Scan QR"</li>
                    <li>Point your camera at the QR code above</li>
                    <li>Confirm the payment details</li>
                    <li>Enter your MPIN to complete payment</li>
                </ol>
                <p>Payment ID: '.$paymentId.'</p>
            </div>
        </div>
    </body>
    </html>';
    
} else {
    // Output the error if there was an issue creating the Payment Link
    echo "Error creating payment link: " . print_r($response, true);
}
?>
