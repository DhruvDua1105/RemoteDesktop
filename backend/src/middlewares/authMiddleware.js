const jwt = require('jsonwebtoken');
const { secretKey } = require('../config/config');

exports.authenticate = (req, res, next) => {
  // Authentication logic using JWT
};
