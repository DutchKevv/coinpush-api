"use strict";
const express_1 = require("express");
const search_controller_1 = require("../controllers/search.controller");
const router = express_1.Router();
router.get('/:text', async function (req, res) {
    try {
        console.log(req.body);
        res.send(await search_controller_1.searchController.search(req.params.text, req.query.limit));
    }
    catch (error) {
        res.status(500).send('Search error');
    }
});
module.exports = router;
//# sourceMappingURL=search.api.js.map