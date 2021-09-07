const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");

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
  var fileId = "1YArmFimyxjlRQmakdpyu7W3RMeVlZBY7qhwwl_K7mRc"; // 1IN8FjEjJ9KaE2Slyml1eT9jRZX0JSMSH
  var dest = fs.createWriteStream("resume.zip");

  drive.files.export(
    {
      auth: auth,
      fileId: fileId,
      mimeType: "application/zip",
    },
    {
      responseType: "stream",
    },
    (err, res) => {
      res.data
        .on("error", (err) => {
          //   done(err);
        })
        .on("end", () => {
          //   done();
        })
        .pipe(dest);
    }
  );

  //   drive.files.get(
  //     {
  //       fileId: fileId,
  //       alt: "media",
  //     },
  //     { responseType: "stream" },
  //     (err, res) => {
  //       res.data
  //         .on("end", () => {
  //           //   resolve("resume.pdf");
  //         })
  //         .on("error", (err) => {
  //           //   reject("Error");
  //         })
  //         .pipe(dest);
  //     }
  //   );
}
