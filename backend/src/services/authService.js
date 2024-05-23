const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { secretKey } = require('../config/config');

exports.hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

exports.comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

exports.generateToken = (payload) => {
  return jwt.sign(payload, secretKey, { expiresIn: '1h' });
};

exports.verifyToken = (token) => {
  return jwt.verify(token, secretKey);
};
