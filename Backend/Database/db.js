const mongoose = require("mongoose");
require("dotenv").config(); // ✅ Load variables here

const connectToMongo = async () => {
    const uri = process.env.MONGO_URI; // ✅ read after loading .env

    if (!uri) {
        console.error("❌ MONGO_URI is missing from environment variables.");
        process.exit(1);
    }

    try {
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("✅ MongoDB connected successfully");
    } catch (err) {
        console.error("❌ Error connecting to MongoDB:", err.message);
        process.exit(1);
    }
};

module.exports = connectToMongo;
