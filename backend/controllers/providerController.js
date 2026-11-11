
const { pool } = require("../db");

async function createProviderProfile(req, res) {
    try {
        const {
            serviceType,
            phone,
            location,
            latitude,
            longitude,
            experience,
            price,
            description
        } = req.body;

        if (
            !serviceType ||
            !phone ||
            !location ||
            experience === undefined ||
            price === undefined ||
            !description
        ) {
            return res.status(400).json({
                message: "Please fill all required fields"
            });
        }

        const [existing] = await pool.execute(
            "SELECT id FROM providers WHERE user_id = ?",
            [req.user.id]
        );

        if (existing.length) {
            return res.status(409).json({
                message: "Provider profile already exists"
            });
        }

        const lat = latitude === undefined || latitude === null ||
            latitude === "" ? null : Number(latitude);

        const lng = longitude === undefined || longitude === null ||
            longitude === "" ? null : Number(longitude);

        if (
            (lat !== null && (!Number.isFinite(lat) || lat < -90 || lat > 90)) ||
            (lng !== null && (!Number.isFinite(lng) || lng < -180 || lng > 180))
        ) {
            return res.status(400).json({
                message: "Invalid GPS coordinates"
            });
        }

        const years = Number(experience);
        const startingPrice = Number(price);

        if (
            !Number.isFinite(years) || years < 0 ||
            !Number.isFinite(startingPrice) || startingPrice < 0
        ) {
            return res.status(400).json({
                message: "Experience and price must be valid non-negative numbers"
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO providers
            (user_id, service_type, phone, location, latitude, longitude,
             experience, price, description, available)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
            [
                req.user.id,
                serviceType.trim(),
                phone.trim(),
                location.trim(),
                lat,
                lng,
                years,
                startingPrice,
                description.trim()
            ]
        );

        return res.status(201).json({
            message: "Provider profile created successfully",
            provider: {
                _id: result.insertId,
                userId: req.user.id,
                serviceType,
                phone,
                location,
                latitude: lat,
                longitude: lng,
                experience: years,
                price: startingPrice,
                description,
                available: true
            }
        });
    } catch (error) {
        console.error("Create provider error:", error.message);

        return res.status(500).json({
            message: "Failed to create provider profile"
        });
    }
}





async function getProviders(req, res) {
    try {
        const service = (req.query.service || "").trim();

        const latitude = Number(req.query.latitude);
        const longitude = Number(req.query.longitude);
        const radius = Number(req.query.radius) || 10;

        const hasLocation =
            req.query.latitude !== undefined &&
            req.query.longitude !== undefined &&
            Number.isFinite(latitude) &&
            Number.isFinite(longitude) &&
            latitude >= -90 && latitude <= 90 &&
            longitude >= -180 && longitude <= 180;

        let sql = `
            SELECT
                p.id AS id,
                u.name AS providerName,
                p.user_id AS userId,
                p.service_type AS serviceType,
                p.phone,
                p.location,
                p.latitude,
                p.longitude,
                p.experience,
                p.price,
                p.description,
                p.available
        `;

        const params = [];

        if (hasLocation) {
            sql += `,
                (
                    6371 * ACOS(
                        LEAST(1, GREATEST(-1,
                            COS(RADIANS(?)) *
                            COS(RADIANS(p.latitude)) *
                            COS(RADIANS(p.longitude) - RADIANS(?)) +
                            SIN(RADIANS(?)) *
                            SIN(RADIANS(p.latitude))
                        ))
                    )
                ) AS distanceKm
            `;

            params.push(latitude, longitude, latitude);
        }

        sql += `
            FROM providers p
            JOIN users u ON p.user_id = u.id
            WHERE p.available = TRUE
        `;

        if (service) {
            sql += " AND p.service_type LIKE ?";
            params.push(`%${service}%`);
        }

        if (hasLocation) {
            sql += `
                AND p.latitude IS NOT NULL
                AND p.longitude IS NOT NULL
                HAVING distanceKm <= ?
                ORDER BY distanceKm ASC
            `;

            params.push(radius);
        } else {
            sql += " ORDER BY p.id DESC";
        }

        const [providers] = await pool.execute(sql, params);

        return res.status(200).json({
            count: providers.length,
            providers
        });

    } catch (error) {
        console.error("Get providers error:", error.message);

        return res.status(500).json({
            message: "Failed to get providers"
        });
    }
}


// GET LOGGED-IN PROVIDER PROFILE

async function getMyProfile(req, res) {
    try {
        const [providers] = await pool.execute(
            `SELECT
                p.id,
                u.name AS providerName,
                u.email,
                p.service_type AS serviceType,
                p.phone,
                p.location,
                p.experience,
                p.price,
                p.description,
                p.available
             FROM providers p
             JOIN users u ON p.user_id = u.id
             WHERE p.user_id = ?`,
            [req.user.id]
        );

        if (providers.length === 0) {
            return res.status(404).json({
                message: "Provider profile not found"
            });
        }

        return res.status(200).json({
            provider: providers[0]
        });

    } catch (error) {
        console.error("Get my profile error:", error.message);

        return res.status(500).json({
            message: "Failed to load provider profile"
        });
    }
}



module.exports = {
    createProviderProfile,
    getProviders,
    getMyProfile
};
