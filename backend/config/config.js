require('dotenv').config();

module.exports = {
    port: process.env.PORT || 8000,
    mongodbUri: process.env.MONGODB_URI,
    secretKey: process.env.SECRET_KEY,
};