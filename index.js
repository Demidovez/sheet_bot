const fs = require("fs");
const readline = require("readline");
const DecompressZip = require("decompress-zip");
const { google } = require("googleapis");
const pdfConverter = require("pdf-poppler");
const path = require("path");

const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
  "https://www.googleapis.com/auth/drive.appdata",
  "https://www.googleapis.com/auth/drive.metadata",
  "https://www.googleapis.com/auth/drive.photos.readonly",
];
const TOKEN_PATH = "token.json";
const ZIP_NAME = "file.pdf";
const ZIP_OUT = "html_sheets";

fs.readFile("credentials.json", (err, content) => {
  if (err) return console.log("Error loading client secret file:", err);
  authorize(JSON.parse(content), listFiles);
});

function authorize(credentials, callback) {
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
}

function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
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
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

function listFiles(auth) {
  const drive = google.drive({ version: "v3", auth });
  var fileId = "1aGVK8_mIj1uNUcfaYfIFS3BvWuvO-pEUPojsrP6C7V7wM"; // 1IN8FjEjJ9KaadE2Slyml1eT9jRZX0JSMSH | 1YArmFimyxjlRQmakaadpyu7W3RMeVlZBY7qhwwl_K7mRc
  var dest = fs.createWriteStream(ZIP_NAME);

  const createZip = new Promise((resolve, reject) => {
    console.log("START");

    drive.files.export(
      {
        auth: auth,
        fileId: fileId,
        mimeType: "application/pdf",
      },
      {
        responseType: "stream",
      },
      (err, res) => {
        console.log("STREAM START");

        if (err) {
          console.log(err);
          reject();
        } else {
          res.data.pipe(dest);
          res.data.on("error", (err) => {
            console.log(err);
            reject();
          });
          dest.on("finish", function () {
            console.log("STREAM DONE");
            resolve();
          });
        }
      }
    );
  });

  createZip.then(() => {
    console.log("GET IMAGE");

    let option = {
      format: "jpeg",
      out_dir: ".",
      out_prefix: path.basename(ZIP_NAME, path.extname(ZIP_NAME)),
      page: 1,
    };

    pdfConverter
      .convert(ZIP_NAME, option)
      .then(() => {
        console.log("file converted");
      })
      .catch((err) => {
        console.log("an error has occurred in the pdf converter " + err);
      });
  });
}
