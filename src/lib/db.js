import mongoose from 'mongoose';

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) {
        console.log("✅ Already connected to MongoDB");
        return;
    }

    console.log("🔗 Connecting to MongoDB:", process.env.MONGODB_URI);

    await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    console.log("✅ Connected to DB:", mongoose.connection.name);
};

export default connectDB;
