// const path = require("path");
// const fs = require("fs");
// const youtubedl = require("youtube-dl-exec");
// const ffmpegPath = require("ffmpeg-static");
// const ffmpeg = require("fluent-ffmpeg");
// const { google } = require("googleapis");
// const OAuth2 = google.auth.OAuth2;

// // Set the path to the ffmpeg binary
// ffmpeg.setFfmpegPath(ffmpegPath);

// // Google Drive setup
// const SCOPES = ["https://www.googleapis.com/auth/drive.file"];
// const TOKEN_PATH = path.join(__dirname, "..", "token.json");
// const CREDENTIALS_PATH = path.join(
//   __dirname,
//   "..",
//   "config",
//   "credentials.json"
// );

// // Function to authorize the client with credentials
// const authorize = (callback) => {
//   fs.readFile(CREDENTIALS_PATH, (err, content) => {
//     if (err) return console.error("Error loading client secret file:", err);

//     const credentials = JSON.parse(content);
//     const { client_secret, client_id, redirect_uris } = credentials.web;
//     const oAuth2Client = new OAuth2(client_id, client_secret, redirect_uris[0]);

//     fs.readFile(TOKEN_PATH, (err, token) => {
//       if (err) {
//         console.error("No token found. Please authorize the app.");
//         getAccessToken(oAuth2Client, (auth) => {
//           callback(auth);
//         });
//         return;
//       }

//       const parsedToken = JSON.parse(token);
//       oAuth2Client.setCredentials(parsedToken);

//       // Check if the access token is expired
//       if (oAuth2Client.isTokenExpiring()) {
//         oAuth2Client.refreshToken(
//           parsedToken.refresh_token,
//           (err, newToken) => {
//             if (err) {
//               console.error("Error refreshing access token", err);
//               getAccessToken(oAuth2Client, (auth) => {
//                 callback(auth);
//               });
//               return;
//             }

//             // Save the new token
//             fs.writeFile(TOKEN_PATH, JSON.stringify(newToken), (err) => {
//               if (err) return console.error("Error saving new token", err);
//               console.log("Token refreshed and stored.");
//             });
//             callback(oAuth2Client);
//           }
//         );
//       } else {
//         callback(oAuth2Client);
//       }
//     });
//   });
// };

// // Function to upload the video to Google Drive
// const uploadToDrive = (auth, filePath, folderId, callback) => {
//   const drive = google.drive({ version: "v3", auth });
//   const fileMetadata = {
//     name: path.basename(filePath),
//     parents: [folderId], // Set the parent folder ID
//   };
//   const media = {
//     mimeType: "video/mp4",
//     body: fs.createReadStream(filePath),
//   };
//   drive.files.create(
//     {
//       resource: fileMetadata,
//       media: media,
//       fields: "id",
//     },
//     (err, file) => {
//       if (err) {
//         console.error("Error uploading file to Google Drive:", err);
//         callback(err, null);
//       } else {
//         console.log("File uploaded to Google Drive, ID:", file.data.id);
//         fs.unlinkSync(filePath); // Delete local file after uploading
//         callback(null, file.data.id);
//       }
//     }
//   );
// };

// const createFolderOnDrive = (auth, folderName, callback) => {
//   const drive = google.drive({ version: "v3", auth });
//   const fileMetadata = {
//     name: folderName,
//     mimeType: "application/vnd.google-apps.folder",
//   };
//   drive.files.create(
//     {
//       resource: fileMetadata,
//       fields: "id",
//     },
//     (err, file) => {
//       if (err) {
//         console.error("Error creating folder on Google Drive:", err);
//         callback(err, null);
//       } else {
//         console.log("Folder created on Google Drive, ID:", file.data.id);
//         callback(null, file.data.id); // Return folder ID
//       }
//     }
//   );
// };

// const ensureFolderExists = (auth, folderName, callback) => {
//   getFolderId(auth, folderName, (err, folderId) => {
//     if (err) {
//       return callback(err, null);
//     }

//     if (folderId) {
//       // Folder exists
//       callback(null, folderId);
//     } else {
//       // Folder does not exist, create it
//       createFolderOnDrive(auth, folderName, callback);
//     }
//   });
// };

// const getFolderId = (auth, folderName, callback) => {
//   const drive = google.drive({ version: "v3", auth });
//   drive.files.list(
//     {
//       q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}'`,
//       fields: "files(id, name)",
//       spaces: "drive",
//     },
//     (err, res) => {
//       if (err) {
//         console.error("Error retrieving folder list:", err);
//         callback(err, null);
//       } else {
//         const folders = res.data.files;
//         if (folders.length) {
//           // Folder exists, return its ID
//           callback(null, folders[0].id);
//         } else {
//           // Folder does not exist
//           callback(null, null);
//         }
//       }
//     }
//   );
// };

// const generateDirectDownloadLink = async (auth, fileId) => {
//   const drive = google.drive({ version: "v3", auth });

//   // Create a permission with view access to anyone with the link
//   await drive.permissions.create({
//     fileId: fileId,
//     resource: {
//       role: "reader",
//       type: "anyone",
//     },
//   });

//   // Get the file metadata including the webContentLink
//   const file = await drive.files.get({
//     fileId: fileId,
//     fields: "webContentLink",
//   });

//   return file.data.webContentLink;
// };

// // DOWNLOAD CONTROLLER
// exports.downloadController = async (req, res) => {
//   const { url } = req.body;

//   // Check if URL is a YouTube link
//   if (!url || !url.includes("youtube.com")) {
//     return res
//       .status(400)
//       .json({ error: "Please provide a valid YouTube URL" });
//   }

//   const videoId = url.substring(url.lastIndexOf("/") + 1);
//   const sanitizedVideoId = videoId.replace(/\?/g, "");

//   try {
//     const timestamp = Date.now();
//     const outputPath = path.resolve(__dirname, "../downloads");
//     const outputTemplate = `${sanitizedVideoId}-${timestamp}`;
//     const outputFile = path.join(outputPath, `${outputTemplate}.mp4`);

//     if (!fs.existsSync(outputPath)) {
//       fs.mkdirSync(outputPath);
//     }

//     // Use youtube-dl to download video and audio in parallel
//     const videoPromise = youtubedl(url, {
//       format: "bestvideo[height<=1440][ext=mp4]/best",
//       output: path.join(outputPath, `${outputTemplate}-video.mp4`),
//     });

//     const audioPromise = youtubedl(url, {
//       format: "bestaudio[ext=m4a]/best",
//       output: path.join(outputPath, `${outputTemplate}-audio.m4a`),
//     });

//     await Promise.all([videoPromise, audioPromise]);

//     // Merge video and audio using ffmpeg
//     ffmpeg()
//       .input(path.join(outputPath, `${outputTemplate}-video.mp4`))
//       .input(path.join(outputPath, `${outputTemplate}-audio.m4a`))
//       .outputOptions("-c:v copy")
//       .outputOptions("-c:a aac")
//       .output(outputFile)
//       .on("end", () => {
//         // Clean up temporary files
//         try {
//           fs.unlinkSync(path.join(outputPath, `${outputTemplate}-video.mp4`));
//           fs.unlinkSync(path.join(outputPath, `${outputTemplate}-audio.m4a`));
//         } catch (err) {
//           console.error("Error cleaning up temporary files:", err);
//         }

//         // Authorize a client with credentials, then call the Google Drive API.
//         authorize((auth) => {
//           // Ensure the "Downloads" folder exists on Google Drive
//           ensureFolderExists(auth, "Downloads", (err, folderId) => {
//             if (err) {
//               return res
//                 .status(500)
//                 .json({ error: "Failed to ensure folder on Google Drive" });
//             }

//             // Upload the file to the "Downloads" folder
//             uploadToDrive(auth, outputFile, folderId, async (err, fileId) => {
//               if (err) {
//                 return res
//                   .status(500)
//                   .json({ error: "Failed to upload to Google Drive" });
//               }

//               try {
//                 const directDownloadLink = await generateDirectDownloadLink(
//                   auth,
//                   fileId
//                 );
//                 return res.status(200).json({
//                   message: "Video uploaded to Google Drive successfully",
//                   directDownloadLink,
//                 });
//               } catch (err) {
//                 console.error("Error generating direct download link:", err);
//                 return res
//                   .status(500)
//                   .json({ error: "Failed to generate direct download link" });
//               }
//             });
//           });
//         });
//       })
//       .on("error", (err) => {
//         console.error("Error merging video and audio:", err);
//         res.status(500).json({ error: "Failed to merge video and audio" });
//       })
//       .run();
//   } catch (error) {
//     console.error("Error processing request:", error);
//     if (error.message.includes("No such format")) {
//       res.status(400).json({ error: "Invalid URL or format not found" });
//     } else {
//       res.status(500).json({ error: "Failed to process download request" });
//     }
//   }
// };

// //DELETE DOWNLOADED VIDEOS CONTROLLER
// exports.deleteController = async (req, res) => {
//   const { videos } = req.body;

//   if (!videos || !Array.isArray(videos) || videos.length === 0) {
//     return res.status(400).json({ error: "No valid videos array provided." });
//   }

//   try {
//     for (const video of videos) {
//       const filePath = path.join(__dirname, "..", "downloads", video);
//       if (fs.existsSync(filePath)) {
//         try {
//           fs.unlinkSync(filePath);
//           console.log(`Deleted ${video}`);
//         } catch (err) {
//           console.error(`Error deleting file ${video}:`, err);
//         }
//       } else {
//         console.log(`File ${video} not found.`);
//       }
//     }
//     res.status(200).json({ message: "Videos deleted successfully." });
//   } catch (error) {
//     console.error("Error deleting videos:", error);
//     res.status(500).json({ error: "Failed to delete videos." });
//   }
// };
