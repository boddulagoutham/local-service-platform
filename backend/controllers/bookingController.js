
const { pool } = require("../db");

// 1. CREATE BOOKING - CUSTOMER
async function createBooking(req, res) {
    try {
        const customerId = req.user.id;

        const {
            providerId,
            serviceType,
            bookingDate,
            address,
            message
        } = req.body;

        if (!providerId || !serviceType || !bookingDate || !address) {
            return res.status(400).json({
                message: "Please provide all required booking details."
            });
        }

        // Check whether provider exists and is available
        const [providers] = await pool.execute(
            `SELECT id, available
             FROM providers
             WHERE id = ?`,
            [providerId]
        );

        if (providers.length === 0 || !providers[0].available) {
            return res.status(404).json({
                message: "Provider is unavailable."
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO bookings
            (customer_id, provider_id, service_type,
             booking_date, address, message, status)
            VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [
                customerId,
                providerId,
                serviceType,
                bookingDate,
                address,
                message || ""
            ]
        );

        return res.status(201).json({
            message: "Booking created successfully!",
            bookingId: result.insertId
        });

    } catch (error) {
        console.error("Create booking error:", error);

        return res.status(500).json({
            message: "Failed to create booking."
        });
    }
}


// 2. GET CUSTOMER BOOKINGS
async function getMyBookings(req, res) {
    try {
        const customerId = req.user.id;

        const [bookings] = await pool.execute(
            `SELECT
                b.id,
                b.provider_id AS providerId,
                b.service_type AS serviceType,
                b.booking_date AS bookingDate,
                b.address,
                b.message,
                b.status,
                b.created_at AS createdAt,
                p.phone AS providerPhone,
                p.location AS providerLocation,
                u.name AS providerName
             FROM bookings b
             JOIN providers p ON b.provider_id = p.id
             JOIN users u ON p.user_id = u.id
             WHERE b.customer_id = ?
             ORDER BY b.created_at DESC`,
            [customerId]
        );

        return res.status(200).json({ bookings });

    } catch (error) {
        console.error("Customer bookings error:", error);

        return res.status(500).json({
            message: "Failed to load customer bookings."
        });
    }
}


// 3. GET PROVIDER BOOKINGS
async function getProviderBookings(req, res) {
    try {
        const providerUserId = req.user.id;

        const [bookings] = await pool.execute(
            `SELECT
                b.id,
                b.customer_id AS customerId,
                b.service_type AS serviceType,
                b.booking_date AS bookingDate,
                b.address,
                b.message,
                b.status,
                b.created_at AS createdAt,
                u.name AS customerName,
                u.email AS customerEmail
             FROM bookings b
             JOIN providers p ON b.provider_id = p.id
             JOIN users u ON b.customer_id = u.id
             WHERE p.user_id = ?
             ORDER BY b.created_at DESC`,
            [providerUserId]
        );

        return res.status(200).json({ bookings });

    } catch (error) {
        console.error("Provider bookings error:", error);

        return res.status(500).json({
            message: "Failed to load provider bookings."
        });
    }
}


// 4. UPDATE BOOKING STATUS - PROVIDER
async function updateBookingStatus(req, res) {
    try {
        const providerUserId = req.user.id;
        const { id } = req.params;
        const { status } = req.body;

        if (!["accepted", "rejected"].includes(status)) {
            return res.status(400).json({
                message: "Invalid booking status."
            });
        }

        const [result] = await pool.execute(
            `UPDATE bookings b
             JOIN providers p ON b.provider_id = p.id
             SET b.status = ?
             WHERE b.id = ?
             AND p.user_id = ?
             AND b.status = 'pending'`,
            [status, id, providerUserId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Booking not found or already processed."
            });
        }

        return res.status(200).json({
            message: `Booking ${status} successfully!`
        });

    } catch (error) {
        console.error("Update booking error:", error);

        return res.status(500).json({
            message: "Failed to update booking."
        });
    }
}



// ACCEPT BOOKING
async function acceptBooking(req, res) {
    req.body = req.body || {};
    req.body.status = "accepted";

    return updateBookingStatus(req, res);
}


// REJECT BOOKING
async function rejectBooking(req, res) {
    req.body = req.body || {};
    req.body.status = "rejected";

    return updateBookingStatus(req, res);
}



// 7. CANCEL BOOKING - CUSTOMER
async function cancelBooking(req, res) {
    try {
        const customerId = req.user.id;
        const { id } = req.params;

        const [result] = await pool.execute(
            `UPDATE bookings
             SET status = 'cancelled'
             WHERE id = ?
             AND customer_id = ?
             AND status = 'pending'`,
            [id, customerId]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({
                message: "Booking cannot be cancelled. It may not exist or is already processed."
            });
        }

        return res.status(200).json({
            message: "Booking cancelled successfully!"
        });

    } catch (error) {
        console.error("Cancel booking error:", error);

        return res.status(500).json({
            message: "Failed to cancel booking."
        });
    }
}


module.exports = {
    createBooking,
    getMyBookings,
    getProviderBookings,
    updateBookingStatus,
    acceptBooking,
    rejectBooking,
    cancelBooking
};
