const express = require("express");
const router = express.Router();
const { downloadController, deleteController, mediator } = require("../controller/downloadController");

router.post("/download-video", downloadController);
router.post("/delete-video", deleteController);

module.exports = router;
    