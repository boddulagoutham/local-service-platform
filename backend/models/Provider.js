const mongoose = require("mongoose");

const providerSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        serviceType: {
            type: String,
            required: true
        },

        phone: {
            type: String,
            required: true
        },

        location: {
    type: String,
    required: true
},

latitude: {
    type: Number,
    required: true
},

longitude: {
    type: Number,
    required: true
},
        experience: {
            type: Number,
            required: true
        },

        description: {
            type: String,
            required: true
        },

        price: {
            type: Number,
            required: true
        },

        available: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Provider", providerSchema);