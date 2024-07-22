const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const CREDENTIALS_PATH = path.join(__dirname, '..', 'config', 'credentials.json');
const TOKEN_PATH = path.join(__dirname, '..', 'token.json');

router.get('/oauth2callback', (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('Missing code parameter');
  }

  fs.readFile(CREDENTIALS_PATH, (err, content) => {
    if (err) return res.status(500).send('Failed to load client secret file');
    
    const credentials = JSON.parse(content);
    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    oAuth2Client.getToken(code, (err, token) => {
      if (err) return res.status(500).send('Error retrieving access token');

      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return res.status(500).send('Error storing the token');
        
        res.send('Authorization successful! You can close this window.');
      });
    });
  });
});

module.exports = router;
