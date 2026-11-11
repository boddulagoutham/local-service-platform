const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        providerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Provider",
            required: true
        },

        serviceType: {
            type: String,
            required: true
        },

        bookingDate: {
            type: Date,
            required: true
        },

        address: {
            type: String,
            required: true
        },

        message: {
            type: String,
            default: ""
        },

        status: {
            type: String,
            enum: [
                "pending",
                "accepted",
                "rejected",
                "completed",
                "cancelled"
            ],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Booking", bookingSchema);