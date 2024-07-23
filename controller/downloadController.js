const path = require("path");
const fs = require("fs");
const youtubedl = require("youtube-dl-exec");
const ffmpegPath = require("ffmpeg-static");
const ffmpeg = require("fluent-ffmpeg");
const axios = require("axios");
const { execFile } = require("child_process");
// const { alldown, ytdown } = require("nayan-media-downloader");
// const instagramDl = require("@sasmeee/igdl");

// Set the path to the ffmpeg binary
ffmpeg.setFfmpegPath(ffmpegPath);

exports.downloadController = async (req, res) => {
  const { url } = req.body;
  const modifiedUrl = url.endsWith("/") ? url.slice(0, -1) : url;
  if (
    !modifiedUrl ||
    (!modifiedUrl.includes("youtube.com") &&
      !modifiedUrl.includes("instagram.com") &&
      !modifiedUrl.includes("facebook.com"))
  ) {
    return res.status(400).json({
      error: "Please provide a valid YouTube, Instagram, or Facebook URL",
    });
  }

  const videoId = modifiedUrl.substring(modifiedUrl.lastIndexOf("/") + 1);
  const sanitizedVideoId = videoId.replace(/\?/g, "");

  try {
    const timestamp = Date.now();
    const outputPath = path.resolve(__dirname, "../downloads");

    const outputTemplate = `${sanitizedVideoId}-${timestamp}`;
    const videoOutputFile = path.join(
      outputPath,
      `${outputTemplate}-video.mp4`
    );
    const audioOutputFile = path.join(
      outputPath,
      `${outputTemplate}-audio.m4a`
    );
    const finalOutputFile = path.join(outputPath, `${outputTemplate}.mp4`);

    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    // Function to execute youtube-dl command
    const execPromise = (cmd, args) =>
      new Promise((resolve, reject) => {
        execFile(cmd, args, (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            resolve(stdout);
          }
        });
      });

    const ytdlPath = path.resolve(
      __dirname,
      "../node_modules/youtube-dl-exec/bin/yt-dlp"
    );

    console.log("ytdlPath path",ytdlPath);

    // Download highest quality video and audio using youtube-dl
    const videoArgs = [
      "--format",
      "bestvideo[ext=mp4]/best",
      "--output",
      videoOutputFile,
      modifiedUrl,
    ];
    const audioArgs = [
      "--format",
      "bestaudio[ext=m4a]/best",
      "--output",
      audioOutputFile,
      modifiedUrl,
    ];

    await Promise.all([
      execPromise(ytdlPath, videoArgs),
      execPromise(ytdlPath, audioArgs),
    ]);

    // Merge video and audio using ffmpeg
    ffmpeg()
      .input(videoOutputFile)
      .input(audioOutputFile)
      .outputOptions("-c:v copy") // Avoid re-encoding video
      .outputOptions("-c:a aac") // Use AAC codec for audio
      .outputOptions("-b:a 192k") // Set audio bitrate to 192k
      .output(finalOutputFile)
      .on("end", () => {
        // Clean up temporary files
        try {
          fs.unlinkSync(videoOutputFile);
          fs.unlinkSync(audioOutputFile);
        } catch (err) {
          console.error("Error cleaning up temporary files:", err);
        }

        res.status(200).json(path.basename(finalOutputFile));
      })
      .on("error", (err) => {
        console.error("Error merging video and audio:", err);
        res.status(500).json({ error: "Failed to merge video and audio" });
      })
      .run();
  } catch (error) {
    console.error("Error processing request:", error);

    if (error.message.includes("No such format")) {
      res.status(400).json({ error: "Invalid URL or format not found" });
    } else {
      res.status(500).json({ error: "Failed to process download request" });
    }
  }
};

// exports.downloadController = async (req, res) => {
//   const { url } = req.body;

//   // alldown(url).then((data) => {
//   //   console.log(data);
//   // });

//   const dataList = await instagramDl(url);
//   console.log(dataList);
// };

exports.deleteController = async (req, res) => {
  const { videos } = req.body;

  if (!videos || !Array.isArray(videos) || videos.length === 0) {
    return res.status(400).json({ error: "No valid videos array provided." });
  }

  try {
    for (const video of videos) {
      const filePath = path.join(__dirname, "..", "downloads", video);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`Deleted ${video}`);
        } catch (err) {
          console.error(`Error deleting file ${video}:`, err);
        }
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
