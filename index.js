const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const app = express();
const port = 8080;

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(cors());

// Serve static files from the 'downloads' directory
app.use("/downloads", express.static(path.join(__dirname, "downloads")));

// Endpoint to download video from a URL
app.use(require("./routes/downloadRoutes"));

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
