const express = require("express");
const router = express.Router();
const {
  downloadController,
  deleteController,
} = require("../controller/downloadController");

router.post("/download/video", downloadController);
// router.post("/delete/video", deleteController);

module.exports = router;
