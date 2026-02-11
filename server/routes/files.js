const router = require('express').Router();
const multer = require('multer');
const path = require('path');

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Single file upload - returns public URL
router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ status: false, msg: 'No file uploaded' });
    const url = `/uploads/${req.file.filename}`;
    return res.json({ status: true, url });
});

module.exports = router;
