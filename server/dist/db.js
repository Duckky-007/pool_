import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
let mongoServerInstance = null;
export async function connectDB() {
    const customUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/poolfund';
    mongoose.set('strictQuery', false);
    try {
        // 1. First attempt to connect to the provided or default MongoDB URI (e.g. localhost:27017 or Atlas)
        console.log(`📡 Connecting to MongoDB at ${customUri}...`);
        await mongoose.connect(customUri, { serverSelectionTimeoutMS: 2000 });
        console.log(`✅ MongoDB connected successfully to: ${customUri}`);
        console.log(`💡 You can open MongoDB Compass and connect to: ${customUri}`);
    }
    catch (err) {
        console.warn(`⚠️ Could not connect to external MongoDB: ${err.message}`);
        console.log(`🚀 Starting high-performance embedded MongoDB server on port 27017 for Compass...`);
        try {
            // 2. Start embedded MongoDB listening on standard port 27017 (or dynamic fallback)
            mongoServerInstance = await MongoMemoryServer.create({
                instance: {
                    port: 27017,
                    dbName: 'poolfund',
                },
            });
            const embeddedUri = mongoServerInstance.getUri() + 'poolfund';
            await mongoose.connect(embeddedUri);
            console.log(`\n============================================================`);
            console.log(`✅ Embedded MongoDB is running and ready!`);
            console.log(`🧭 Connect MongoDB Compass to: mongodb://127.0.0.1:27017`);
            console.log(`📂 Database name in Compass: poolfund`);
            console.log(`============================================================\n`);
        }
        catch (fallbackError) {
            // If port 27017 has another binding issue, try dynamic port
            console.warn(`Port 27017 unavailable for embedded server, retrying with dynamic port...`);
            mongoServerInstance = await MongoMemoryServer.create({
                instance: {
                    dbName: 'poolfund',
                },
            });
            const fallbackUri = mongoServerInstance.getUri();
            await mongoose.connect(fallbackUri);
            console.log(`\n============================================================`);
            console.log(`✅ Embedded MongoDB running!`);
            console.log(`🧭 Connect MongoDB Compass to: ${fallbackUri}`);
            console.log(`============================================================\n`);
        }
    }
}
export async function disconnectDB() {
    await mongoose.disconnect();
    if (mongoServerInstance) {
        await mongoServerInstance.stop();
    }
}
