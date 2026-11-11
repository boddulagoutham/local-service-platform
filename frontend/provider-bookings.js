
const API_URL = "http://localhost:5000";

const bookingList = document.getElementById("bookingList");

async function loadProviderBookings() {
    const token = localStorage.getItem("token");

    if (!token) {
        bookingList.textContent = "Please log in first.";
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/bookings/provider`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load bookings.");
        }

        bookingList.innerHTML = "";

        if (!data.bookings || data.bookings.length === 0) {
            bookingList.textContent = "No customer booking requests yet.";
            return;
        }

        data.bookings.forEach(booking => {
            const card = document.createElement("div");
            card.className = "provider-card";

            const heading = document.createElement("h3");
            heading.textContent = booking.serviceType || "Service Booking";
            card.appendChild(heading);

            const details = [
                `Customer: ${booking.customerId?.name || "N/A"}`,
                `Email: ${booking.customerId?.email || "N/A"}`,
                `Date: ${new Date(booking.bookingDate).toLocaleString()}`,
                `Address: ${booking.address || "N/A"}`,
                `Message: ${booking.message || "No message"}`,
                `Status: ${booking.status}`
            ];

            details.forEach(detail => {
                const p = document.createElement("p");
                p.textContent = detail;
                card.appendChild(p);
            });

            if (booking.status === "pending") {
                const acceptButton = document.createElement("button");
                acceptButton.textContent = "Accept";
                acceptButton.addEventListener("click", () => {
                    updateBooking(booking._id, "accept");
                });

                const rejectButton = document.createElement("button");
                rejectButton.textContent = "Reject";
                rejectButton.addEventListener("click", () => {
                    updateBooking(booking._id, "reject");
                });

                card.appendChild(acceptButton);
                card.appendChild(rejectButton);
            }

            bookingList.appendChild(card);
        });

    } catch (error) {
        console.error("Booking loading error:", error);
        bookingList.textContent = error.message;
    }
}

async function updateBooking(bookingId, action) {
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(
            `${API_URL}/api/bookings/${action}/${bookingId}`,
            {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Could not update booking.");
        }

        alert(data.message);
        loadProviderBookings();

    } catch (error) {
        console.error("Booking update error:", error);
        alert(error.message);
    }
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
}

loadProviderBookings();
