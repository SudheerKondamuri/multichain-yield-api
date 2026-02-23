import express from 'express';
import cors from 'cors';
import yieldRoutes from './api/routes/yieldRoutes.js';
import dotenv from 'dotenv';
// IMPORTANT: We don't import redisClient directly here to avoid hanging connections if we just want a stateless webserver, 
// though sometimes we do. Let yieldController handle it.

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api', yieldRoutes);

app.listen(PORT, () => {
    console.log(`🚀 API Server running on port ${PORT}`);
});
