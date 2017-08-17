"use strict";
const express_1 = require("express");
const multer = require("multer");
const path_1 = require("path");
const user_1 = require("../schemas/user");
const user_controller_1 = require("../controllers/user.controller");
const router = express_1.Router();
// set the directory for the uploads to the uploaded to
const DIR = path_1.join(__dirname, '..', '..', '..', 'images', 'images', 'profile');
const storage = multer.diskStorage({
    destination: DIR,
    filename: function (req, file, cb) {
        cb(null, req.user.id + '_' + Date.now() + path_1.extname(file.originalname));
        return;
    }
});
const upload = multer({ storage: storage });
router.post('/profile', upload.single('image'), async (req, res, next) => {
    try {
        await user_controller_1.userController.update(req.user.id, { profileImg: req.file.filename });
        console.log('FIEL FILE LDSFKSDLFSDFDF', user_1.User.normalizeProfileImg(req.file.filename));
        res.send({ url: user_1.User.normalizeProfileImg(req.file.filename) });
    }
    catch (error) {
        next(error);
    }
});
module.exports = router;
//# sourceMappingURL=file-upload.js.map