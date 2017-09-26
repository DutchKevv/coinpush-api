"use strict";
const express_1 = require("express");
const multer = require("multer");
const path_1 = require("path");
const channel_controller_1 = require("../controllers/channel.controller");
const config = require('../../../tradejs.config');
const router = express_1.Router();
// set the directory for the uploads to the uploaded to
const DIR = path_1.join(__dirname, '..', '..', '..', 'images', 'images', 'profile');
const storage = multer.diskStorage({
    destination: DIR,
    filename: function (req, file, cb) {
        cb(null, req.user.id + '_' + Date.now() + path_1.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });
function normalizeProfileImg(filename) {
    if (filename) {
        if (filename.indexOf('http://') > -1)
            return filename;
        return path_1.join(config.image.profileBaseUrl, filename);
    }
    else
        return config.image.profileDefaultUrl;
}
;
router.post('/profile', upload.single('image'), async (req, res, next) => {
    try {
        const result = await channel_controller_1.channelController.updateByUserId(req.user, req.user.id, { profileImg: req.file.filename });
        console.log('asdfsadfsdfads', result);
        res.send({ url: normalizeProfileImg(req.file.filename) });
    }
    catch (error) {
        console.log(error);
        next(error);
    }
});
module.exports = router;
//# sourceMappingURL=upload.api.js.map