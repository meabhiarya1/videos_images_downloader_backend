const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const youtubedl = require("youtube-dl-exec"); // Import youtube-dl-exec
const fs = require("fs");
const path = require("path");
const app = express();
const port = 8080;

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(cors());

// Serve static files from the 'downloads' directory
app.use("/downloads", express.static(path.join(__dirname, "downloads")));

// Endpoint to download video from a URL
app.post("/download-video", async (req, res) => {
  const { url } = req.body;
  const videoId = url.substring(url.lastIndexOf("/") + 1);

  try {
    // Define the output path and file name
    const timestamp = Date.now(); // Get current timestamp in milliseconds
    const outputPath = path.resolve(__dirname, "downloads");
    const outputTemplate = `${videoId}-${timestamp}.%(ext)s`;
    const outputFile = path.join(outputPath, outputTemplate);

    // Ensure the downloads directory exists
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath);
    }

    // Use youtube-dl to download the video
    await youtubedl(url, {
      output: outputFile,
    });

    // Find the actual downloaded file name (as it could include extension changes)
    const files = fs.readdirSync(outputPath);
    const downloadedFile = files.find((file) =>
      file.includes(outputTemplate.split(".")[0])
    );

    // Stream the file to the response
    const fileStream = fs.createReadStream(
      path.join(outputPath, downloadedFile)
    );
    fileStream.pipe(res);
    res.status(200).json(downloadedFile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to download video" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
