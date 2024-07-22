const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const app = express();
require("dotenv").config();

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(cors());

// Serve static files from the 'downloads' directory
app.use("/downloads", express.static(path.join(__dirname, "downloads")));

// Include routes
app.use(require("./routes/downloadRoutes"));
// app.use(require("./routes/authRoutes"));

// Start the server
app.listen(process.env.PORT, () => {
  console.log(`Server is running at http://localhost:${process.env.PORT}`);
});
