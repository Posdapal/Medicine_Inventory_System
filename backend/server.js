// 1. ALWAYS load dotenv at the absolute top of your entry file
require('dotenv').config();

const express = require('express');
// 2. Import your db configuration to establish the connection
const db = require('./src/config/db'); 

const app = express();
app.use(express.json());

// 3. Fallback safely to 8081 if process.env.PORT fails to load
const PORT = process.env.PORT || 8081;

app.listen(PORT, () => {
    console.log(`Server Running on port ${PORT}`);
});
