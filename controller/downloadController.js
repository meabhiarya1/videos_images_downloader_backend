const youtubedl = require("youtube-dl-exec");
const fs = require("fs");
const path = require("path");

exports.downloadController = async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "No URL provided" });
  }

  const videoId = url.substring(url.lastIndexOf("/") + 1);
  const sanitizedVideoId = videoId.replace(/\?/g, "");

  try {
    // Define the output path and file name
    const timestamp = Date.now(); // Get current timestamp in milliseconds
    const outputPath = path.resolve(__dirname, "../downloads");
    const outputTemplate = `${sanitizedVideoId}-${timestamp}.mp4`;
    const outputFile = path.join(outputPath, outputTemplate);

    // Ensure the downloads directory exists
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath);
    }

    // Use youtube-dl to download the video
    await youtubedl(url, {
      format:
        "bestvideo[height<=1080][ext=mp4]/best[height<=1080][ext=mp4]/best[ext=mp4]/best",
      output: outputFile,
    });

    // Find the actual downloaded file name (as it could include extension changes)
    const files = fs.readdirSync(outputPath);
    const downloadedFile = files.find((file) =>
      file.includes(outputTemplate.split(".")[0])
    );

    if (!downloadedFile) {
      throw new Error("Downloaded file not found");
    }

    res.status(200).json(downloadedFile);
  } catch (error) {
    console.error("Error downloading video:", error);

    if (error.message.includes("No such format")) {
      res.status(400).json({ error: "Invalid URL or format not found" });
    } else if (error.message.includes("Downloaded file not found")) {
      res.status(500).json({ error: "Downloaded file not found" });
    } else {
      res.status(500).json({ error: "Failed to download video" });
    }
  }
};

exports.deleteController = async (req, res) => {
  console.log(req.body)
  const { videos } = req.body;

  if (!videos || !Array.isArray(videos) || videos.length === 0) {
    return res.status(400).json({ error: "No valid videos array provided." });
  }

  try {
    for (const video of videos) {
      const filePath = path.join(__dirname, "..", "downloads", video);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted ${video}`);
      } else {
        console.log(`File ${video} not found.`);
      }
    }
    res.status(200).json({ message: "Videos deleted successfully." });
  } catch (error) {
    console.error("Error deleting videos:", error);
    res.status(500).json({ error: "Failed to delete videos." });
  }
};