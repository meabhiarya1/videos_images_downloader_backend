const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser"); // Import body-parser
const app = express();
const port = 8080;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Endpoint to download video from a URL
app.post("/download-video", async (req, res) => {
  const { url } = req.body;

  try {
    // Fetch video data from the provided URL
    const response = await axios.get(url, {
      responseType: "arraybuffer", // Ensure binary data
    });


    // Extract filename from URL
    const filename = url.split("/").pop();

    // Set headers for binary data download
    res.set({
      "Content-Type": response.headers["content-type"],
      "Content-Disposition": `attachment; filename="${filename}"`,
    });

    // Send the binary data as response
    res.send(response.data);
  } catch (error) {
    console.error("Error downloading video:", error);
    res.status(500).send("Error downloading video");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
