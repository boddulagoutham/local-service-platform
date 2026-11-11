const jwt = require("jsonwebtoken");

function protect(req, res, next) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Please login first"
        });
    }

    const token = header.substring(7);

    try {
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing");
            return res.status(500).json({
                message: "Server authentication configuration error"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next();

    } catch (error) {
        console.error("JWT verification error:", error.message);

        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
}

module.exports = protect;

