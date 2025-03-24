const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']; 
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.redirect('/users/login');
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            req.flash('error_msg', 'Session expired. Please log in again.');
            return res.redirect('/users/login'); 
        }
        req.user = user;
        next(); 
    });
}

module.exports = authenticateToken;
