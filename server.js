import dotenv from 'dotenv';
import express from 'express';
import {connectDB} from './src/config/connectDb.js';
import authRouter from './src/routes/authRoute.js';
import cookieParser from 'cookie-parser';
import cors from 'cors'
import categoryRoute from './src/routes/categoryRoute.js';
import subCategoryRoute from './src/routes/subCategoryRoute.js';
import assetRoute from './src/routes/assetRoute.js';
import otpRouter from './src/routes/otpRoute.js';
import filterRouter from './src/routes/filterRoute.js';
import contactRouter from './src/routes/contactRoute.js';
import enquireRouter from './src/routes/enquireRoute.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: ["http://localhost:3000"],
  credentials: true,             
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/category', categoryRoute);
app.use('/api/subCategory', subCategoryRoute);
app.use('/api/contact', contactRouter);
app.use('/api/asset', assetRoute);
app.use('/api/otp', otpRouter);
app.use('/api/enquire', enquireRouter);
app.use('/api/filter', filterRouter);
app.get('/api/', (req, res) => res.send("Welcome to Assetlist webapp backend ✅"));

connectDB().then(() => {
  app.listen(PORT, () => console.log(`server is running successfully on ${PORT} ✅`));
});
