const fs = require('fs');
const path = require('path');
const process = require('process');
const {google} = require('googleapis');
const { OAuth2 } = google.auth;

const envs = require("./env.json");
const { file } = require('googleapis/build/src/apis/file');

const googleDriveScope = ['https://www.googleapis.com/auth/drive'];

// TODO: maybe this should be class-ified
// But if it ain't broke don't fix it

// Google Auth utility functions
async function checkTokenScopes(access_token) {
  try {
    // const { token } = client.credentials;
    const oauth2 = google.oauth2('v2');
    const response = await oauth2.tokeninfo({ access_token: access_token });
    
    // Check if the required scopes are present
    const scopes = response.data.scope.split(' ');
    if (scopes.includes(googleDriveScope[0])) {
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}

async function loadSavedCredentialsIfExist() {
  try {
    const credentials = envs.google["token"];
    const client = google.auth.fromJSON(credentials);

    if (!credentials.access_token) return null;

    const hasDriveScope = await checkTokenScopes(credentials.access_token);
    if (hasDriveScope) {
      return client;  // Return client if the required scope exists
    } else {
      console.log('Missing required Drive scope, regenerating token...');
      return null;  // Return null to trigger token regeneration
    }
  } catch (err) {
    console.error('Failed to load saved credentials:', err);
    return null;
  }
}

async function saveCredentials(client) {
  const key = envs.google.web;
  const payload = {
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
    access_token: client.credentials.access_token
  };
  envs.google["token"] = payload;
  fs.writeFileSync("./env.json", JSON.stringify(envs, null, 4))
}

async function authorizeDrive() {
  // Attempt to load from saved credentials
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }

  // Create client to refresh token with
  const { client_id, client_secret, redirect_uris } = envs.google.web;
  const oAuth2Client = new OAuth2(client_id, client_secret, redirect_uris[0]);

  // Attempt to refresh token
  refreshToken = envs.google?.token?.refresh_token;
  if (refreshToken) {
    // console.log("Attempting to refresh google access token using " + refreshToken)
    try {
      oAuth2Client.setCredentials({ refresh_token: refreshToken });
      const tokens = await oAuth2Client.refreshAccessToken();
      oAuth2Client.setCredentials(tokens.credentials);
      await saveCredentials(oAuth2Client);
      return oAuth2Client;
    } catch (err) {
      // If we can't refresh, we have to login with gmail and generate a new token from scratch
      // console.log("Could not refresh access token:")
      console.err(err);
    }
  }

  // Return nothing and don't backup for now if production environment
  if (!envs.beta) {
    errorCallback("Drive backups need to be fully reauthenticated by hand")
    return null;
  }

  // Generate a new authorization URL if no token is available
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: googleDriveScope,
    prompt: 'consent'
  });
  console.log('Authorize this app by visiting this url:', authUrl);

  // After the user grants permissions, get the auth code from the user
  const code = await new Promise((resolve) => {
    console.log('Enter the code from that page here:');
    process.stdin.once('data', (data) => {
      resolve(data.toString().trim());
    });
  });

  // Exchange the authorization code for tokens
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);

  // Save the credentials for future use
  await saveCredentials(oAuth2Client);
  return oAuth2Client;
}

async function listFiles(drive) {
  const res = await drive.files.list({
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  });
  const files = res.data.files;
  if (files.length === 0) {
    console.log('No files found.');
    return;
  }

  console.log('Files:');
  files.map((file) => {
    console.log(`${file.name} (${file.id})`);
  });
}

// Other google utility functions
async function uploadTextFile(drive, filePath) {
  const fileMetadata = {
    name: (envs.beta ? "beta-" : "") + path.basename(filePath), // File name on Drive
    parents: [envs.google.folderID]
  };
  const media = {
    mimeType: "text/plain",
    body: fs.createReadStream(filePath),
  };

  try {
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id', // Fields to return in the response
    });

    // console.log('Backup saved to:', response.data.id);
    return response.data.id;
  } catch (error) {
    errorCallback('Error uploading file:', error.message);
    throw error;
  }
}

async function removeFileFromFolder(drive, folderId, fileId) {
  try {
    await drive.files.update({
      fileId: fileId,
      removeParents: folderId
    });
    // console.log(`File with ID ${fileId} removed from folder ${folderId}`);
  } catch (err) {
    errorCallback(`Failed to remove file from folder: ${err}`);
  }
}

async function deleteFileIfExists(drive, folderId, fileName) {
  // TODO: if this takes up too much storage it may need to auto-remove storage.json from the trash permanently

  fileName = path.basename(fileName);
  if (envs.beta) {
    fileName = "beta-" + path.basename(fileName);
  }

  try {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and name='${fileName}' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
      orderBy: 'createdTime asc',
    });
    
    const files = res.data.files;
    if (files.length > 0) {
      // If a file with the same name exists, delete it (or remove from folder if we don't own it)
      const fileId = files[0].id;

      // console.log(`File "${fileName}" exists. Deleting file with ID: ${fileId}`);
      try {
        // Try deleting
        await drive.files.delete({ fileId: fileId });
      } catch {
        removeFileFromFolder(drive, folderId, fileId)
        // It will err if owned by someone else, so try removing from folder
      }
      
    } else {
      // console.log(`No file named "${fileName}" found.`);
    }
  } catch (err) {
    console.error('Error deleting file:', err);
  }
}


// Actual backup code
let googleDrive = null;
let googleAuthClient = null;
let errorCallback = console.log;

async function reauthenticate() {
  // Returns whether it successfully create authenticated with google

  // Attempt to authenticate client
  let client = null
  let err = null
  try {
    client = await authorizeDrive()
  } catch (e) {
    err = e
  }
  
  // Check if authenticated
  if (!client) {
    errorCallback("ERROR: caught authentication error, skipping backups until next successful authentication.\n"+err)
    return false;
  }
  
  // Define global drive client
  googleAuthClient = client;
  googleDrive = google.drive({ version: 'v3', auth: client });
  return true;
}

async function backupToDrive(filename, attempt=0) {
  // errorCallback("Backing up...");
  try {
    if (!googleDrive) {
      // console.log("Google drive has not been defined yet")
      throw new Error("Authenticate");
    }
    await deleteFileIfExists(googleDrive, envs.google.folderID, filename)
    await uploadTextFile(googleDrive, filename)
    return true;
  } catch (err) {
    switch (attempt) {
      case 0:
        // errorCallback("Drive error caught, reauthenticating drive...");
        await reauthenticate();
        return await backupToDrive(filename, attempt+1);
      case 1:
        errorCallback("WARNING: two drive errors in a row, giving up this round of backups.");
        return false
    }
  }
}

function startBackupThread(filename, msFrequency, userErrorCallback=null, backupNow=false) {
  // Set error handler
  if (userErrorCallback) errorCallback = userErrorCallback;

  // Create intervals
  setInterval(() => {
    backupToDrive(filename);
  }, msFrequency);

  // Backup now, slight delay for bot to login during
  if (backupNow) {
    setTimeout(() => {
      backupToDrive(filename)
    }, 2500);
  }
}

// Export backup thread starter
module.exports = startBackupThread;