const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
const path = require("path");

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];
const TOKEN_PATH = "token.json";
const CREDENTIALS_PATH = path.join(__dirname, "config/credentials.json");

const authorize = (credentials, callback) => {
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
};

const getAccessToken = (oAuth2Client, callback) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline", // Ensure this is included
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error("Error retrieving access token", err);
      oAuth2Client.setCredentials(token);
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error("Error writing token file", err);
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
};

fs.readFile(CREDENTIALS_PATH, (err, content) => {
  if (err) return console.error("Error loading client secret file:", err);
  authorize(JSON.parse(content), () => {
    console.log("Authorization successful");
  });
});
