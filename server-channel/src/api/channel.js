"use strict";
const express_1 = require("express");
const channel_controller_1 = require("../controllers/channel.controller");
const router = express_1.Router();
/**
 * LIST
 */
router.get('/:id?', async (req, res, next) => {
    const type = req.query.type;
    try {
        if (type === 'profile-overview') {
            let results = await Promise.all([
                channel_controller_1.channelController.findByUserId(req.params.id || req.user.id)
            ]);
            res.send({
                user: results[0]
            });
        }
    }
    catch (error) {
        console.error(error);
        next(error);
    }
});
/**
 * SINGLE
 */
router.get('/:id', function (req, res, next) {
    console.log(req.query);
    channel_controller_1.channelController.find(req.query);
});
module.exports = router;
//# sourceMappingURL=channel.js.map