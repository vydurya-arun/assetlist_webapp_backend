import dotenv from 'dotenv';
import express from 'express';
import {connectDB} from './src/config/connectDb.js';
import authRouter from './src/routes/authRoute.js';
import cookieParser from 'cookie-parser';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRouter)
app.get('/api/', (req, res) => res.send("Welcome to Assetlist webapp backend ✅"));

connectDB().then(() => {
  app.listen(PORT, () => console.log(`server is running successfully on ${PORT} ✅`));
});
