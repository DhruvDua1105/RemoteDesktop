const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const signup = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        console.log("request body", req.body);
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        next(error);
    }
};
const signin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        console.log("user", req.body);
        if (!user) {
            return res.status(404).json({ "error": "Invalid user" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ "error": "Invalid email or password" });
        }

        const refreshToken = jwt.sign({ email: user.email }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '2d' });
        user.refreshToken = refreshToken;
        await user.save();
        const accessToken = jwt.sign({ email: user.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5s' });

        console.log("user", user);

        return res
            .status(200)
            .json({ accessToken, refreshToken, userId: user._id, "success": true })

    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        const { userId } = req.body;
        console.log("user", userId);
        if (!userId) {
            return res.status(404).json({ "error": "Invalid user" });
        }

        const filter = { _id: userId };
        console.log("filter", filter);
        const update = { $unset: { refreshToken: 1 } };

        const result = await User.updateOne(filter, update);
        console.log("result", result);
        res.status(200).json({ success: true, message: 'Logout successful' });

    } catch (error) {
        next(error);
    }
};

const access = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        console.log("authHeader", req.headers);
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Authorization header missing or invalid' });
        }
        const accessToken = authHeader.split(' ')[1];

        jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({ success: false, message: 'Access token expired' });
                } else {
                    return res.status(401).json({ success: false, message: 'Invalid access token' });
                }
            } else {
                return res.status(200).json({ success: true, accessToken });
            }
        });
    } catch (error) {
        next(error);
    }
};


const refreshAccessToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Authorization header missing or invalid' });
        }

        const accessToken = authHeader.split(' ')[1];
        console.log("accessToken", accessToken);
        const { userId, refreshToken } = req.body;

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decode) => {
            if (err) {
                console.log("err", err);
                if (err.name === 'TokenExpiredError') {
                    return res.status(400).json({ success: false, message: 'refreshtoken is expired' });
                } else {
                    return res.status(400).json({ success: false, message: 'Invalid refresh token' });
                }
            }
            else {
                jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                    if (err) {
                        if (err.name === 'TokenExpiredError') {
                            console.log(userId);
                            console.log("refreshToken", refreshToken);

                            if (!userId) {
                                return res.status(400).json({ success: false, message: 'userId missing in the request body' });
                            }
                            const newAccessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5s' });

                            return res.status(201).json({ success: true, accessToken: newAccessToken });

                        } else {
                            return res.status(401).json({ success: false, message: 'Invalid access token' });
                        }
                    } else {
                        return res.status(200).json({ success: true, message: 'Access token is valid, no need to refresh' });
                    }
                });
            }
        })
    } catch (error) {
        next(error);
    }
};



module.exports = {
    signup, signin, access, refreshAccessToken, logout
}