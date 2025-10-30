import express from 'express';


const app = express();
const PORT = 4000;
app.get('/',(req, res)=> res.send("Welcome to Assetlist webapp backend"));

app.listen(PORT,()=>console.log(`server is running sucessfully on ${PORT} `))
