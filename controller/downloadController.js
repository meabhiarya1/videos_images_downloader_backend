const path = require("path");
const fs = require("fs");
const youtubedl = require("youtube-dl-exec");
const ffmpegPath = require("ffmpeg-static");
const ffmpeg = require("fluent-ffmpeg");
const axios = require("axios");
// const { alldown, ytdown } = require("nayan-media-downloader");
const instagramDl = require("@sasmeee/igdl");

// Set the path to the ffmpeg binary
ffmpeg.setFfmpegPath(ffmpegPath);

exports.downloadController = async (req, res) => {
  const { url } = req.body;

  // Check if URL is a YouTube link
  if (
    !url ||
    (!url.includes("youtube.com") && !url.includes("instagram.com") && !url.includes("facebook.com") )
  ) {
    return res
      .status(400)
      .json({ error: "Please provide a valid YouTube or Instagram URL" });
  }

  const videoId = url.substring(url.lastIndexOf("/") + 1);
  const sanitizedVideoId = videoId.replace(/\?/g, "");

  try {
    const timestamp = Date.now();
    const outputPath = path.resolve(__dirname, "../downloads");
    const outputTemplate = `${sanitizedVideoId}-${timestamp}`;
    const outputFile = path.join(outputPath, `${outputTemplate}.mp4`);

    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath);
    }

    // Use youtube-dl to download video and audio in parallel
    const videoPromise = youtubedl(url, {
      format: "bestvideo[height>=1920][ext=mp4]/best",
      output: path.join(outputPath, `${outputTemplate}-video.mp4`),
    });

    const audioPromise = youtubedl(url, {
      format: "bestaudio[ext=m4a]/best",
      output: path.join(outputPath, `${outputTemplate}-audio.m4a`),
    });

    await Promise.all([videoPromise, audioPromise]);

    // Merge video and audio using ffmpeg
    ffmpeg()
      .input(path.join(outputPath, `${outputTemplate}-video.mp4`))
      .input(path.join(outputPath, `${outputTemplate}-audio.m4a`))
      .outputOptions("-c:v copy")
      .outputOptions("-c:a aac")
      .output(outputFile)
      .on("end", () => {
        // Clean up temporary files
        try {
          fs.unlinkSync(path.join(outputPath, `${outputTemplate}-video.mp4`));
          fs.unlinkSync(path.join(outputPath, `${outputTemplate}-audio.m4a`));
        } catch (err) {
          console.error("Error cleaning up temporary files:", err);
        }

        res.status(200).json(path.basename(outputFile));
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

//   // let URL = await ytdown("https://www.youtube.com/watch?v=reuUDX3_T2Q");
//   // console.log(URL);
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
