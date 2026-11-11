
let customerLatitude = null;
let customerLongitude = null;

// =========================
// API CONFIGURATION
// =========================

const API_URL = "http://localhost:5000";

// =========================
// HELPER: READ API RESPONSE
// =========================

async function readResponse(response) {
    const text = await response.text();

    try {
        return text ? JSON.parse(text) : {};
    } catch {
        return { message: text || "Invalid server response." };
    }
}

// =========================
// REGISTER
// =========================

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const role = document.getElementById("role").value;
        const message = document.getElementById("message");

        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, role })
            });

            const data = await readResponse(response);

            if (response.ok) {
                message.textContent = "Registration successful! Please login.";
                message.style.color = "green";
                registerForm.reset();

                setTimeout(() => {
                    window.location.href = "login.html";
                }, 1000);
            } else {
                message.textContent = data.message || "Registration failed.";
                message.style.color = "red";
            }
        } catch (error) {
            console.error("Registration error:", error);
            message.textContent = "Cannot connect to server.";
            message.style.color = "red";
        }
    });
}

// =========================
// LOGIN
// =========================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;
        const message = document.getElementById("loginMessage");

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await readResponse(response);

            if (response.ok && data.user && data.token) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));

                message.textContent = "Login successful! Redirecting...";
                message.style.color = "green";

                setTimeout(() => {
                    if (data.user.role === "provider") {
                        window.location.href = "provider.html";
                    } else {
                        window.location.href = "customer.html";
                    }
                }, 1000);
            } else {
                message.textContent =
                    data.message || "Invalid email or password.";
                message.style.color = "red";
            }
        } catch (error) {
            console.error("Login error:", error);
            message.textContent = "Cannot connect to server.";
            message.style.color = "red";
        }
    });
}

// =========================
// SERVICE INFORMATION
// =========================

const serviceInfo = {
    "Electrician": {
        description: "Professional electrical repair and installation services.",
        information: "Wiring, switch repairs, fan installation, lighting installation and electrical maintenance."
    },

    "Plumber": {
        description: "Reliable plumbing services for homes and workplaces.",
        information: "Pipe repairs, tap installation, drainage cleaning and water leakage repairs."
    },

    "Mechanic": {
        description: "Vehicle repair and maintenance services.",
        information: "Bike repairs, car servicing, engine checks and general vehicle maintenance."
    },

    "Carpenter": {
        description: "Furniture repair and professional woodwork services.",
        information: "Furniture repairs, door fitting, shelves and custom woodwork."
    },

    "Cleaning": {
        description: "Home and office cleaning services.",
        information: "Deep cleaning, bathroom cleaning, kitchen cleaning and housekeeping."
    },

    "AC Repair": {
        description: "Air conditioner repair and maintenance services.",
        information: "AC installation, servicing, gas refilling and troubleshooting."
    }
};

// =========================
// SERVICE SELECTION
// =========================

function selectService(service) {

    const searchInput = document.getElementById("searchInput");
    const nearbySection = document.getElementById("nearbyProviders");
    const providersContainer = document.getElementById("providers");

    // Check required HTML elements
    if (!searchInput || !nearbySection || !providersContainer) {
        console.error("Required HTML elements are missing.");
        return;
    }

    // Set selected service in search box
    searchInput.value = service;

    // Show loading message
    providersContainer.innerHTML = `
        <div class="empty-message">
            <h3>🔍 Finding ${service} Providers...</h3>
            <p>Please wait while we search for nearby professionals.</p>
        </div>
    `;

    // Scroll to providers section
    nearbySection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    // Search actual service providers
    searchServices();
}

// =========================
// HIDE SERVICE DETAILS
// =========================

function hideServiceDetails() {
    const serviceDetails = document.getElementById("serviceDetails");

    if (serviceDetails) {
        serviceDetails.style.display = "none";
    }
}

// =========================
// SERVICE SEARCH - MYSQL API
// =========================


async function searchServices() {
    const searchInput = document.getElementById("searchInput");
    const providersContainer = document.getElementById("providers");
    const nearbySection = document.getElementById("nearbyProviders");

    if (!searchInput || !providersContainer) {
        console.error("Search HTML elements not found.");
        return;
    }

    const service = searchInput.value.trim();

    if (!service) {
        alert("Please enter a service name.");
        return;
    }

    // Show loading message
    providersContainer.innerHTML = `
        <div class="empty-message">
            <h3>🔍 Searching for ${service}...</h3>
            <p>Please wait.</p>
        </div>
    `;

    if (nearbySection) {
        nearbySection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    try {
        // Get GPS coordinates
        // Search providers without GPS filtering
const params = new URLSearchParams({
    service: service
});

        // Call backend API
        const response = await fetch(
            `${API_URL}/api/provider?${params.toString()}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to find providers.");
        }

        providersContainer.innerHTML = "";

        // No providers found
        if (!Array.isArray(data.providers) || data.providers.length === 0) {
            providersContainer.innerHTML = `
                <div class="empty-message">
                    <h3>No ${service} providers found</h3>
                    <p>Try another service or increase your search radius.</p>
                </div>
            `;
            return;
        }

        // Display provider count
        const countHeading = document.createElement("h3");
        countHeading.className = "provider-count";
        countHeading.textContent =
            `${data.count ?? data.providers.length} ${service} providers found`;
        providersContainer.appendChild(countHeading);

        // Display provider cards
        data.providers.forEach(provider => {
            const card = document.createElement("div");
            card.className = "provider-card";

            const heading = document.createElement("h3");
            heading.textContent =
                `👨‍🔧 ${provider.providerName || "Service Provider"}`;
            card.appendChild(heading);

            const details = [
                `🛠️ Service: ${provider.serviceType || "N/A"}`,
                `📍 Location: ${provider.location || "N/A"}`,
                `💼 Experience: ${provider.experience ?? "N/A"} years`,
                `💰 Starting Price: ₹${provider.price ?? "N/A"}`,
                `📞 Phone: ${provider.phone || "N/A"}`,
                `📝 ${provider.description || "No description available"}`,
                `📏 Distance: ${provider.distanceKm != null ? Number(provider.distanceKm).toFixed(1) + " km" : "Not available"}`
            ];

            details.forEach(detail => {
                const paragraph = document.createElement("p");
                paragraph.textContent = detail;
                card.appendChild(paragraph);
            });

            const bookButton = document.createElement("button");
            bookButton.textContent = "Book Now";

            const providerId = provider._id ?? provider.id;

            if (providerId != null) {
                bookButton.addEventListener("click", () => {
                   bookService(providerId, provider.serviceType || service);
                });
            } else {
                bookButton.disabled = true;
                bookButton.textContent = "Booking unavailable";
            }

            card.appendChild(bookButton);
            providersContainer.appendChild(card);
        });

    } catch (error) {
        console.error("Search error:", error);

        providersContainer.innerHTML = `
            <div class="empty-message">
                <h3>Something went wrong!</h3>
                <p>${error.message}</p>
                <p>Check whether your backend server is running.</p>
            </div>
        `;
    }
}



// =========================
// PROVIDER PROFILE
// =========================

const providerForm = document.getElementById("providerForm");

if (providerForm) {
    providerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const token = localStorage.getItem("token");
        const message = document.getElementById("providerMessage");

        if (!token) {
            if (message) {
                message.textContent = "Please login first.";
                message.style.color = "red";
            }
            return;
        }

        const serviceType = document.getElementById("serviceType").value;
        const phone = document.getElementById("phone").value.trim();
        const location = document.getElementById("location").value.trim();
        const experience = Number(
            document.getElementById("experience").value
        );
        const price = Number(document.getElementById("price").value);
        const description = document.getElementById("description").value.trim();

        try {
            const response = await fetch(
                `${API_URL}/api/provider/profile`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        serviceType,
                        phone,
                        location,
                        experience,
                        price,
                        description
                    })
                }
            );

            const data = await readResponse(response);

            if (response.ok) {
                if (message) {
                    message.textContent =
                        "Provider profile created successfully!";
                    message.style.color = "green";
                }

                providerForm.reset();

            } else {
                if (message) {
                    message.textContent =
                        data.message || "Something went wrong.";
                    message.style.color = "red";
                }

                if (response.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");

                    setTimeout(() => {
                        window.location.href = "login.html";
                    }, 1000);
                }
            }

        } catch (error) {
            console.error("Provider profile error:", error);

            if (message) {
                message.textContent = "Cannot connect to server.";
                message.style.color = "red";
            }
        }
    });
}

// =========================
// BOOK SERVICE - MYSQL API
// =========================


async function bookService(providerId, serviceType) {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    const bookingDate = prompt(
        "Enter booking date and time (Example: 2026-11-10 10:00):"
    );

    if (!bookingDate) return;

    const address = prompt("Enter your service address:");
    if (!address) return;

    const message = prompt("Describe your service requirement:") || "";

    try {
        const response = await fetch(`${API_URL}/api/bookings`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                providerId: Number(providerId),
                serviceType: serviceType,
                bookingDate,
                address,
                message
            })
        });

        const data = await readResponse(response);

        if (response.ok) {
            alert("Booking request sent successfully!");
        } else {
            alert(data.message || "Booking failed.");
        }

    } catch (error) {
        console.error("Booking error:", error);
        alert("Cannot connect to server.");
    }
}


// =========================
// LOCATION DETECTION
// =========================

function detectLocation() {
    const locationText = document.getElementById("locationText");

    if (!locationText) return;

    if (!navigator.geolocation) {
        locationText.textContent = "Location is not supported.";
        return;
    }

    navigator.geolocation.getCurrentPosition(
        position => {
            customerLatitude = position.coords.latitude;
            customerLongitude = position.coords.longitude;

            localStorage.setItem("customerLatitude", customerLatitude);
            localStorage.setItem("customerLongitude", customerLongitude);

            locationText.textContent = "Location detected";

            console.log("Customer Latitude:", customerLatitude);
            console.log("Customer Longitude:", customerLongitude);
        },

        error => {
            console.error("Location error:", error.message);

            locationText.textContent =
                "Unable to detect location. Check browser permissions.";
        }
    );
}

// =========================
// LOGOUT
// =========================

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "login.html";
}

// =========================
// MY BOOKINGS
// =========================

function showBookings() {
    window.location.href = "bookings.html";
}

// =========================
// START LOCATION DETECTION
// =========================

detectLocation();


async function loadMyBookings() {
    const container = document.getElementById("myBookings");
    const token = localStorage.getItem("token");

    if (!container) return;

    if (!token) {
        container.textContent = "Please login to view your bookings.";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/bookings/my`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await readResponse(response);

        if (!response.ok) {
            throw new Error(data.message || "Unable to load bookings.");
        }

        const bookings = Array.isArray(data.bookings)
            ? data.bookings
            : [];

        container.innerHTML = "";

        if (bookings.length === 0) {
            container.textContent = "You don't have any bookings yet.";
            return;
        }

        bookings.forEach(booking => {
            const card = document.createElement("div");
            card.className = "provider-card";

            const title = document.createElement("h3");
            title.textContent =
                booking.providerName || "Service Provider";
            card.appendChild(title);

            const details = [
                ["Service", booking.serviceType],
                ["Booking Date", booking.bookingDate],
                ["Address", booking.address],
                ["Message", booking.message],
                ["Status", booking.status]
            ];

            details.forEach(([label, value]) => {
                const p = document.createElement("p");
                p.textContent = `${label}: ${value ?? "N/A"}`;
                card.appendChild(p);
            });

            container.appendChild(card);
        });

    } catch (error) {
        console.error("My bookings error:", error);
        container.textContent = error.message;
    }
}

function getCustomerLocation() {
    return new Promise((resolve, reject) => {

        if (!navigator.geolocation) {
            reject(new Error("GPS is not supported by your browser."));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            position => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            error => {
                reject(new Error(
                    "Please allow location access to find nearby providers."
                ));
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );
    });
}
document.getElementById("searchInput")?.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        searchServices();
    }
});



// LOAD PROVIDER INCOMING BOOKINGS
async function loadProviderBookings() {
    const token = localStorage.getItem("token");
    const container = document.getElementById("providerBookings");

    if (!container) return;

    if (!token) {
        container.innerHTML = "<p>Please login first.</p>";
        return;
    }

    container.innerHTML = "<p>Loading bookings...</p>";

    try {
        const response = await fetch(
            "http://localhost:5000/api/bookings/provider",
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            container.innerHTML = `<p>${data.message || "Failed to load bookings."}</p>`;
            return;
        }

        const bookings = data.bookings || [];

        if (bookings.length === 0) {
            container.innerHTML = "<p>No incoming bookings found.</p>";
            return;
        }

        container.innerHTML = bookings.map(booking => `
            <div class="booking-card">
                <h3>${booking.service_type || booking.serviceType || "Service"}</h3>
                <p><strong>Customer:</strong> ${booking.customerName || "N/A"}</p>
                <p><strong>Email:</strong> ${booking.customerEmail || "N/A"}</p>
                <p><strong>Date:</strong> ${booking.booking_date || booking.bookingDate || "N/A"}</p>
                <p><strong>Address:</strong> ${booking.address || "N/A"}</p>
                <p><strong>Message:</strong> ${booking.message || "No message"}</p>
                <p><strong>Status:</strong> ${booking.status || "Pending"}</p>

                ${booking.status === "pending" ? `
                    <button onclick="acceptBooking(${booking.id})">Accept</button>
                    <button onclick="rejectBooking(${booking.id})">Reject</button>
                ` : ""}
            </div>
        `).join("");

    } catch (error) {
        console.error("Provider bookings error:", error);
        container.innerHTML = "<p>Could not connect to server.</p>";
    }
}

// CUSTOMER DASHBOARD
async function loadCustomerBookings() {
    const token = localStorage.getItem("token");
    const container = document.getElementById("customerBookings");

    if (!container) return;

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(
            "http://localhost:5000/api/bookings/my",
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            container.innerHTML =
                `<p>${data.message || "Unable to load bookings."}</p>`;
            return;
        }

        const bookings = data.bookings || [];

        // Update dashboard counters
        document.getElementById("customerTotal").textContent =
            bookings.length;

        document.getElementById("customerPending").textContent =
            bookings.filter(b => b.status === "pending").length;

        document.getElementById("customerAccepted").textContent =
            bookings.filter(b => b.status === "accepted").length;

        document.getElementById("customerRejected").textContent =
            bookings.filter(b => b.status === "rejected").length;

        if (bookings.length === 0) {
            container.innerHTML = `
                <p>You haven't booked any services yet.</p>
                <a href="index.html">Explore Services</a>
            `;
            return;
        }

        container.innerHTML = bookings.map(booking => `
            <div class="booking-card">
                <h3>${booking.serviceType || "Service"}</h3>

                <p>📅 Date: ${
                    booking.bookingDate
                    ? new Date(booking.bookingDate).toLocaleString()
                    : "Not available"
                }</p>

                <p>📍 Address: ${booking.address || "Not provided"}</p>

                <p>💬 Message: ${booking.message || "No message"}</p>

                <p>
    <strong>Status: ${booking.status}</strong>
</p>

${
    booking.status === "pending"
    ? `
        <button
            type="button"
            onclick="cancelCustomerBooking(${Number(booking.id)})">
            Cancel Booking
        </button>
    `
    : ""
}
            </div>
        `).join("");

    } catch (error) {
        console.error("Customer bookings error:", error);
        container.innerHTML = "<p>Could not connect to server.</p>";
    }
}

// Load only on customer dashboard
// Load only on customer dashboard
// CUSTOMER DASHBOARD
if (document.getElementById("customerBookings")) {
    console.log("Customer dashboard detected.");
    loadCustomerBookings();
}

// PROVIDER DASHBOARD
if (document.getElementById("providerBookings")) {
    console.log("Provider dashboard detected.");
    loadProviderBookings();
}
async function cancelCustomerBooking(bookingId) {
    const token = localStorage.getItem("token");

    if (!confirm("Are you sure you want to cancel this booking?")) {
        return;
    }

    try {
        const response = await fetch(
            `http://localhost:5000/api/bookings/cancel/${bookingId}`,
            {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Cancellation failed.");
            return;
        }

        alert("Booking cancelled successfully!");

        // Refresh bookings and counters
        loadCustomerBookings();

    } catch (error) {
        console.error("Cancel booking error:", error);
        alert("Could not connect to server.");
    }
}

function openMyBookings() {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token || !user) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    if (user.role === "provider") {
        window.location.href = "provider.html";
    } else {
        window.location.href = "customer.html";
    }
}

// Change button name based on account type
document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const button = document.getElementById("bookingsNavButton");

    if (user && button && user.role === "provider") {
        button.textContent = "Service Hub";
    }
});
