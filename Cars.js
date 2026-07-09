import { database } from "./firebase-config.js";
import { ref, get, set, push, update, remove, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Firebase Reference
const carsRef = ref(database, "cars");

// Sidebar Navigation
document.addEventListener("DOMContentLoaded", () => {
    ["dashboard", "track-cars", "bookings", "cars", "users", "settings"].forEach(id => {
        document.getElementById(id).addEventListener("click", () => {
            window.location.href = id + ".html";
        });
    });

    // Initialize reference images functionality
    setupReferenceImages();
    
    // Add event delegation for edit buttons
    carsList.addEventListener('click', handleCarActions);
});

// Modal Elements
const addCarBtn = document.getElementById("addCarBtn");
const modal = document.getElementById("carModal");
const closeModal = document.querySelector(".close");
const carForm = document.getElementById("carForm");
const carsList = document.getElementById("carsList");
const carImageInput = document.getElementById("carImage");
const previewImage = document.getElementById("previewImage");

let base64Image = "";
let currentCarId = null;

// Setup reference images functionality
function setupReferenceImages() {
    const addMoreImagesBtn = document.getElementById("addMoreImagesBtn");
    addMoreImagesBtn.addEventListener("click", function() {
        addReferenceImageField();
    });
    addReferenceImageField();
}

function addReferenceImageField(initialImage = "", isFromDB = false) {
    const referenceImagesContainer = document.getElementById("referenceImagesContainer");
    const newImageItem = document.createElement("div");
    newImageItem.className = "reference-image-item";
    
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.className = "referenceImage";
    fileInput.accept = "image/*";
    
    const preview = document.createElement("img");
    preview.className = "reference-preview";
    
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-image-btn";
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    
    // Handle initial image (either from DB or new upload)
    if (initialImage) {
        preview.src = initialImage;
        preview.style.display = 'block';
        removeBtn.style.display = 'block';
        
        // If image is from DB, create a hidden input to store the URL
        if (isFromDB) {
            const hiddenInput = document.createElement("input");
            hiddenInput.type = "hidden";
            hiddenInput.className = "db-image-url";
            hiddenInput.value = initialImage;
            newImageItem.appendChild(hiddenInput);
        }
    } else {
        preview.style.display = 'none';
        removeBtn.style.display = 'none';
    }
    
    fileInput.addEventListener("change", function(e) {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.match('image.*')) {
                alert('Please select a valid image file');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(event) {
                preview.src = event.target.result;
                preview.style.display = 'block';
                removeBtn.style.display = 'block';
                
                // Remove the hidden DB image URL if it exists
                const hiddenInput = newImageItem.querySelector('.db-image-url');
                if (hiddenInput) {
                    hiddenInput.remove();
                }
            };
            reader.readAsDataURL(file);
        }
    });
    
    removeBtn.addEventListener("click", function() {
        newImageItem.remove();
    });
    
    newImageItem.appendChild(fileInput);
    newImageItem.appendChild(preview);
    newImageItem.appendChild(removeBtn);
    referenceImagesContainer.appendChild(newImageItem);
}

function clearReferenceImages() {
    const referenceImagesContainer = document.getElementById("referenceImagesContainer");
    referenceImagesContainer.innerHTML = "";
    addReferenceImageField();
}

// Open Modal for Adding Car
addCarBtn.onclick = () => {
    document.getElementById("modalTitle").textContent = "Add New Car";
    currentCarId = null;
    document.getElementById("carId").value = "";
    carForm.reset();
    base64Image = "";
    previewImage.style.display = "none";
    clearReferenceImages();
    modal.style.display = "flex";
};

// Close Modal
closeModal.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };

// Convert Image to Base64 When Selected
carImageInput.addEventListener("change", function () {
    const file = carImageInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = function () {
            base64Image = reader.result;
            previewImage.src = base64Image;
            previewImage.style.display = "block";
        };
        reader.readAsDataURL(file);
    }
});

// Handle Form Submission
carForm.onsubmit = async (e) => {
    e.preventDefault();

    // Get Form Data
    const carName = document.getElementById("carName").value;
    const carModel = document.getElementById("carModel").value;
    const carYear = document.getElementById("carYear").value;
    const licensePlate = document.getElementById("licensePlate").value;
    const rentalPrice = document.getElementById("rentalFee").value;
    const numSeats = document.getElementById("numSeats").value;
    const description = document.getElementById("description").value;
    const gps_id = document.getElementById("gpsId").value;

    if (!carName || !rentalPrice) {
        alert("Car name and rental price are required!");
        return;
    }

    // Get reference images
    const referenceImagesData = [];
    const previews = document.querySelectorAll('.reference-preview[src]:not([src=""])');
    previews.forEach(preview => {
        if (preview.src && !preview.src.includes("data:,")) {
            referenceImagesData.push(preview.src);
        }
    });
    const dbImageUrls = document.querySelectorAll('.db-image-url');
    dbImageUrls.forEach(input => {
        if (input.value) {
            referenceImagesData.push(input.value);
        }
    });
    const carData = { 
        carName, 
        carModel, 
        carYear, 
        licensePlate, 
        rentalPrice, 
        numSeats, 
        description,
        gps_id,
        status: "active", 
        image: base64Image,
        referenceImages: referenceImagesData
    };

    try {
        if (currentCarId) {
            const carRef = ref(database, `cars/${currentCarId}`);
            await update(carRef, carData);
            console.log("Car updated successfully");
        } else {
            const newCarRef = push(ref(database, "cars"));
            await set(newCarRef, carData);
            console.log("Car added successfully");
        }
        modal.style.display = "none";
    } catch (error) {
        console.error("Error saving car:", error);
        alert("Failed to save car. Please try again.");
    }
};

// Fetch and Display Cars
onValue(carsRef, (snapshot) => {
    carsList.innerHTML = "";
    if (snapshot.exists()) {
        snapshot.forEach((car) => {
            const carData = car.val();
            const carDiv = document.createElement("div");
            carDiv.classList.add("car-card");

            const isDisabled = carData.status === "disabled";
            if (isDisabled) {
                carDiv.classList.add("disabled-car");
            }

            const imageUrl = carData.image ? carData.image : "https://via.placeholder.com/150";

            carDiv.innerHTML = `
                <img src="${imageUrl}" alt="Car Image" class="car-image">
                <h3>${carData.carName}</h3>
                <p><strong>Model:</strong> ${carData.carModel}</p>
                <p><strong>Year:</strong> ${carData.carYear}</p>
                <p><strong>License Plate:</strong> ${carData.licensePlate}</p>
                <p><strong>GPS ID:</strong> ${carData.gps_id || 'Not assigned'}</p>
                <p><strong>Rental Fee:</strong> ₱${carData.rentalPrice}</p>
                <p><strong>Seats:</strong> ${carData.numSeats}</p>
                <p class="car-description"><strong>Description:</strong> ${carData.description}</p>
                <div class="car-buttons">
                    <button class="edit-btn" data-id="${car.key}" data-name="${encodeURIComponent(carData.carName || '')}" data-model="${encodeURIComponent(carData.carModel || '')}" data-year="${encodeURIComponent(carData.carYear || '')}" data-plate="${encodeURIComponent(carData.licensePlate || '')}" data-price="${encodeURIComponent(carData.rentalPrice || '')}" data-seats="${encodeURIComponent(carData.numSeats || '')}" data-desc="${encodeURIComponent(carData.description || '')}" data-gps="${encodeURIComponent(carData.gps_id || '')}" data-img="${encodeURIComponent(carData.image || '')}" data-refs="${encodeURIComponent(JSON.stringify(carData.referenceImages || []))}">Edit</button>
                    <button class="${isDisabled ? 'enable-btn' : 'disable-btn'}" data-id="${car.key}" data-status="${carData.status}">
                        ${isDisabled ? "Enable" : "Disable"}
                    </button>
                </div>
            `;

            carsList.appendChild(carDiv);
        });
    } else {
        carsList.innerHTML = "<p>No cars available.</p>";
    }
});

// Handle car actions (edit/disable/enable)
function handleCarActions(e) {
    if (e.target.classList.contains('edit-btn')) {
        const btn = e.target;
        editCar(
            btn.dataset.id,
            decodeURIComponent(btn.dataset.name),
            decodeURIComponent(btn.dataset.model),
            decodeURIComponent(btn.dataset.year),
            decodeURIComponent(btn.dataset.plate),
            decodeURIComponent(btn.dataset.price),
            decodeURIComponent(btn.dataset.seats),
            decodeURIComponent(btn.dataset.desc),
            decodeURIComponent(btn.dataset.gps),
            decodeURIComponent(btn.dataset.img),
            JSON.parse(decodeURIComponent(btn.dataset.refs))
        );
    } else if (e.target.classList.contains('disable-btn') || e.target.classList.contains('enable-btn')) {
        const btn = e.target;
        toggleCarStatus(btn.dataset.id, btn.dataset.status);
    }
}

// Edit Car Function
function editCar(id, name, model, year, plate, fee, seats, description, gps_id, image, referenceImages = []) {
    currentCarId = id;
    document.getElementById("modalTitle").textContent = "Edit Car";
    document.getElementById("carId").value = id;
    document.getElementById("carName").value = name;
    document.getElementById("carModel").value = model;
    document.getElementById("carYear").value = year;
    document.getElementById("licensePlate").value = plate;
    document.getElementById("rentalFee").value = fee;
    document.getElementById("numSeats").value = seats;
    document.getElementById("description").value = description;
    document.getElementById("gpsId").value = gps_id || '';

    if (image) {
        base64Image = image;
        previewImage.src = image;
        previewImage.style.display = "block";
    } else {
        base64Image = "";
        previewImage.style.display = "none";
    }

    clearReferenceImages();
    if (referenceImages && referenceImages.length > 0) {
        referenceImages.forEach(img => {
            addReferenceImageField(img, true); // true indicates this is from DB
        });
    } else {
        addReferenceImageField(); // Add one empty field if no reference images
    }

    modal.style.display = "flex";
}

// Toggle Car Status
function toggleCarStatus(carId, currentStatus) {
    const newStatus = currentStatus === "active" ? "disabled" : "active";
    update(ref(database, "cars/" + carId), { status: newStatus })
        .then(() => console.log(`Car ${newStatus === "disabled" ? "disabled" : "enabled"} successfully.`))
        .catch((error) => console.error("Error updating car status:", error));
}