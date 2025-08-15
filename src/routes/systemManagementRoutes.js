const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login');
    }
    res.render('admin/systemManagement', { user: req.session.user });
});

module.exports = router;
