import { getDatabase, ref, onValue, push, set, get } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-database.js";
import { database } from "./firebase-config.js";

// Helper function to safely set text content
function safeSetTextContent(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    } else {
        console.warn(`Element with ID ${elementId} not found`);
    }
}

// Helper function to safely set span content
function safeSetSpanContent(parentId, text) {
    const parent = document.getElementById(parentId);
    if (parent) {
        const span = parent.querySelector('span');
        if (span) {
            span.textContent = text;
        } else {
            parent.textContent = text;
        }
    } else {
        console.warn(`Parent element with ID ${parentId} not found`);
    }
}

// Function to show modal with a message
function showModal(message) {
    const modal = document.getElementById("messageModal");
    const modalMessage = document.getElementById("modalMessage");

    if (modal && modalMessage) {
        modalMessage.textContent = message;
        modal.style.display = "flex";

        // Close modal when clicking the close button
        const closeBtn = modal.querySelector(".close");
        if (closeBtn) {
            closeBtn.addEventListener("click", () => {
                modal.style.display = "none";
            });
        }

        // Close modal when clicking the OK button
        const okBtn = document.getElementById("modalOkBtn");
        if (okBtn) {
            okBtn.addEventListener("click", () => {
                modal.style.display = "none";
            });
        }

        // Close modal when clicking outside the modal
        window.addEventListener("click", (event) => {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        });
    } else {
        console.error("Modal elements not found!");
    }
}

// Helper Functions for Validation and Processing
function clearErrorHighlights() {
    document.querySelectorAll('.input-error').forEach(el => {
        el.classList.remove('input-error');
    });
    document.querySelectorAll('.error-message').forEach(el => {
        el.remove();
    });
}

function validateBookingFields(fullName, bookingDate, bookingTime, fromLocation, toLocation, selectedCar) {
    const errors = {};
    let isValid = true;
    let message = "Please fix the following issues:";

    if (!fullName) {
        errors.fullName = "Full name is required";
        isValid = false;
        message += "\n- " + errors.fullName;
    }

    if (!bookingDate) {
        errors.bookingDate = "Booking date is required";
        isValid = false;
        message += "\n- " + errors.bookingDate;
    } else if (!isFutureDate(bookingDate)) {
        errors.bookingDate = "Please select a future date";
        isValid = false;
        message += "\n- " + errors.bookingDate;
    }

    if (!bookingTime) {
        errors.bookingTime = "Booking time is required";
        isValid = false;
        message += "\n- " + errors.bookingTime;
    }

    if (!fromLocation) {
        errors.fromLocation = "Starting location is required";
        isValid = false;
        message += "\n- " + errors.fromLocation;
    }

    if (!toLocation) {
        errors.toLocation = "Destination is required";
        isValid = false;
        message += "\n- " + errors.toLocation;
    }

    if (!selectedCar) {
        errors.car = "No car selected";
        isValid = false;
        message += "\n- " + errors.car;
    }

    return {
        isValid,
        message,
        errors
    };
}

function isFutureDate(dateString) {
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
}

function highlightErrorFields(errors) {
    for (const [fieldId, errorMessage] of Object.entries(errors)) {
        const fieldElement = document.getElementById(fieldId);
        if (fieldElement) {
            fieldElement.classList.add('input-error');

            const errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.textContent = errorMessage;

            fieldElement.parentNode.appendChild(errorElement);
        }
    }
}

function createBookingData(userId, fullName, bookingDate, bookingTime, bookingDateTime, car, fromLocation, toLocation) {
    return {
        userId: userId,
        fullName: fullName,
        bookingDate: bookingDate,
        bookingTime: bookingTime,
        bookingDateTime: bookingDateTime,
        car: car,
        fromLocation: fromLocation,
        toLocation: toLocation,
        timestamp: new Date().toISOString(),
        status: "upcoming",
    };
}

async function processBooking(bookingData) {
    const bookingsRef = ref(database, "bookings");
    const bookingCounterRef = ref(database, "bookingCounter");

    const snapshot = await get(bookingCounterRef);
    let bookingCounter = snapshot.exists() ? snapshot.val() : 0;

    bookingCounter++;
    const bookingKey = `b${bookingCounter}`;
    await set(ref(database, `bookings/${bookingKey}`), bookingData);
    await set(bookingCounterRef, bookingCounter);
}

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded");

    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    const userId = loggedInUser ? loggedInUser.userId : null;

    if (!userId) {
        showModal("You must be logged in to book a car.");
        setTimeout(() => window.location.href = "user-login.html", 2000);
        return;
    }

    // Navigation setup
    const setupNavigation = () => {
        const navItems = {
            dashboard: "user-dashboard.html",
            Viewmap: "index11.html",
            "view-mybooking": "my-bookings.html",
            notif: "user-dashboard.html",
            trans: "user-dashboard.html",
            set: "user-settings.html"
        };

        Object.entries(navItems).forEach(([id, url]) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener("click", () => {
                    window.location.href = url;
                });
            }
        });

        const logoutBtn = document.getElementById("logout");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => {
                localStorage.removeItem("loggedInUser");
                window.location.href = "user-login.html";
            });
        }
    };
    setupNavigation();

    // Modal setup
    const carsGrid = document.getElementById("carsList");
    const carModal = document.getElementById("carModal");
    const destinationModal = document.getElementById("destinationModal");
    const messageModal = document.getElementById("messageModal");

    // Initialize modals as hidden
    [carModal, destinationModal, messageModal].forEach(modal => {
        if (modal) modal.style.display = "none";
    });

    let selectedCar = null;

    function openCarModal(carData) {
        selectedCar = carData;

        // Set main car details
        safeSetTextContent('modalCarName', carData.carName || 'N/A');
        safeSetTextContent('modalCarModel', carData.carModel || 'N/A');
        safeSetTextContent('modalCarYear', carData.carYear || 'N/A');
        safeSetTextContent('modalRentalFee', carData.rentalPrice ? `$${carData.rentalPrice}/day` : 'N/A');
        safeSetTextContent('modalSeats', carData.numSeats || 'N/A');
        safeSetTextContent('modalDescription', carData.description || 'N/A');

        // Set main image
        const mainImage = document.getElementById('modalCarImage');
        if (mainImage) {
            const imageUrl = carData.image || 'https://via.placeholder.com/300';
            mainImage.src = imageUrl;
            mainImage.style.display = 'block';
            mainImage.onerror = () => {
                mainImage.src = 'https://via.placeholder.com/300';
            };
        }

        // Populate carousel with reference images
        const carousel = document.getElementById('imageCarousel');
        if (carousel) {
            carousel.innerHTML = '';

            // Combine main image and reference images for carousel
            const allImages = [carData.image, ...(carData.referenceImages || [])].filter(img => img);

            if (allImages.length > 0) {
                allImages.forEach((imgSrc, index) => {
                    const img = document.createElement('img');
                    img.src = imgSrc;
                    img.alt = `Car view ${index + 1}`;
                    img.onerror = () => {
                        img.src = 'https://via.placeholder.com/80x60';
                        img.onclick = null;
                    };
                    img.onclick = () => {
                        if (mainImage) {
                            mainImage.src = imgSrc;
                            mainImage.style.display = 'block';
                        }
                        document.querySelectorAll('#imageCarousel img').forEach(img => img.classList.remove('active'));
                        img.classList.add('active');
                    };
                    if (index === 0) img.classList.add('active');
                    carousel.appendChild(img);
                });
            } else {
                carousel.innerHTML = '<p>No images available</p>';
            }
        }

        // Initialize carousel navigation
        const prevBtn = document.getElementById('carouselPrev');
        const nextBtn = document.getElementById('carouselNext');

        function moveCarousel(direction) {
            if (!carousel) return;
            const scrollAmount = carousel.clientWidth * 0.8 * direction;
            carousel.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        }

        if (prevBtn) {
            prevBtn.onclick = () => moveCarousel(-1);
        }
        if (nextBtn) {
            nextBtn.onclick = () => moveCarousel(1);
        }

        // Show the modal
        if (carModal) {
            carModal.style.display = 'block';
            document.body.classList.add('modal-open');
        }
    }

    // ... (rest of your code remains the same)

    // ... (rest of your code remains the same)

    function moveCarousel(direction) {
        const carousel = document.getElementById('imageCarousel');
        if (carousel) {
            carousel.scrollBy({
                left: direction * 100,
                behavior: 'smooth'
            });
        }
    }

    function openDestinationModal() {
        if (destinationModal) destinationModal.style.display = "flex";
    }

    function closeDestinationModal() {
        if (destinationModal) destinationModal.style.display = "none";
    }

    function closeCarModal() {
        if (carModal) {
            carModal.style.display = "none";
            document.body.classList.remove('modal-open');
        }
    }

    // Setup modal close buttons
    const setupModalCloseButtons = () => {
        const closeButtons = [
            { modal: carModal, button: carModal?.querySelector(".close") },
            { modal: destinationModal, button: destinationModal?.querySelector(".close") }
        ];

        closeButtons.forEach(({ modal, button }) => {
            if (button && modal) {
                button.addEventListener("click", () => {
                    modal.style.display = "none";
                    document.body.classList.remove('modal-open');
                });
            }
        });

        window.addEventListener("click", (event) => {
            if (event.target === carModal) closeCarModal();
            if (event.target === destinationModal) closeDestinationModal();
        });
    };
    setupModalCloseButtons();

    // Book Now button
    const bookNowBtn = document.getElementById("bookNowBtn");
    if (bookNowBtn) {
        bookNowBtn.addEventListener("click", () => {
            closeCarModal();
            openDestinationModal();
        });
    }

    // Confirm Destination button
    const confirmDestinationBtn = document.getElementById("confirmDestinationBtn");
    if (confirmDestinationBtn) {
        confirmDestinationBtn.addEventListener("click", async () => {
            const getValue = (id) => document.getElementById(id)?.value.trim() || '';

            const fullName = getValue("fullName");
            const bookingDate = getValue("bookingDate");
            const bookingTime = getValue("bookingTime");
            const fromLocation = getValue("fromLocation");
            const toLocation = getValue("toLocation");

            clearErrorHighlights();

            const validation = validateBookingFields(
                fullName,
                bookingDate,
                bookingTime,
                fromLocation,
                toLocation,
                selectedCar
            );

            if (!validation.isValid) {
                highlightErrorFields(validation.errors);
                return;
            }

            try {
                const bookingDateTime = `${bookingDate} ${bookingTime}`;
                const bookingData = createBookingData(
                    userId,
                    fullName,
                    bookingDate,
                    bookingTime,
                    bookingDateTime,
                    selectedCar,
                    fromLocation,
                    toLocation
                );

                await processBooking(bookingData);
                showModal("Booking confirmed! Your booking is being processed.");
                document.getElementById("destinationForm")?.reset();
                closeDestinationModal();
            } catch (error) {
                console.error("Error saving booking data: ", error);
                showModal("An error occurred while processing your booking. Please try again.");
            }
        });
    }

    // Fetch cars function
    function fetchCars() {
        if (!carsGrid) return;

        carsGrid.innerHTML = `<div class="loading-spinner">Loading cars...</div>`;
        const carsRef = ref(database, "cars");

        onValue(
            carsRef,
            (snapshot) => {
                const cars = snapshot.val();
                carsGrid.innerHTML = "";

                if (cars) {
                    Object.keys(cars).forEach((key) => {
                        const car = cars[key];
                        if (car.status === "active") {
                            if (car.referenceImages && typeof car.referenceImages === 'object') {
                                car.referenceImages = Object.values(car.referenceImages);
                            } else if (!car.referenceImages) {
                                car.referenceImages = [];
                            }

                            const carCard = document.createElement("div");
                            carCard.classList.add("car-card");
                            carCard.innerHTML = `
                                <div class="car-image">
                                    <img src="${car.image || "https://via.placeholder.com/300"}" 
                                         alt="${car.carName}" 
                                         onerror="this.src='https://via.placeholder.com/300'">
                                </div>
                                <div class="car-details">
                                    <h3>${car.carName}</h3>
                                    <div class="specs-row">
                                        <span>Model: ${car.carModel}</span>
                                        <span>•</span>
                                        <span>Year: ${car.carYear}</span>
                                    </div>
                                    <div class="price-row">
                                        <span class="price">₱${car.rentalPrice}/day</span>
                                    </div>
                                    <button class="view-details-btn" data-car='${JSON.stringify(car)}'>Book Now</button>
                                </div>
                            `;
                            carsGrid.appendChild(carCard);
                        }
                    });

                    document.querySelectorAll(".view-details-btn").forEach((btn) => {
                        btn.addEventListener("click", function () {
                            const carData = JSON.parse(this.getAttribute("data-car"));
                            openCarModal(carData);
                        });
                    });

                    if (carsGrid.innerHTML === "") {
                        carsGrid.innerHTML = "<p>No active cars available.</p>";
                    }
                } else {
                    carsGrid.innerHTML = "<p>No cars available.</p>";
                }
            },
            (error) => {
                console.error("Error fetching cars: ", error);
                carsGrid.innerHTML = "<p>Error loading cars. Please try again later.</p>";
            }
        );
    }

    fetchCars();
});