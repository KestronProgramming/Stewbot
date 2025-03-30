// Exports a promise that resolves to the backup function.
// Uses dynamic import for faster initial require time.

const startBackupThreadPromise = new Promise(async (resolve, reject) => {
    // Declare module variables - will be loaded lazily
    let fs, path, process, google, OAuth2, envs;
    let googleAuthClient = null;
    let googleDrive = null;
    let errorCallback = console.error; // Default to console.error

    const numberBackups = 5;
    const googleDriveScope = ['https://www.googleapis.com/auth/drive'];

    // --- Utility Functions ---

    // Lazily load basic Node modules when first needed
    const loadFs = async () => { if (!fs) fs = require('fs'); return fs; };
    const loadPath = async () => { if (!path) path = require('path'); return path; };
    const loadProcess = async () => { if (!process) process = require('process'); return process; };
    // Load envs synchronously as it's often needed early and is small
    const loadEnvs = () => { if (!envs) envs = require("./env.json"); return envs; };

    // Lazily load Google APIs
    const loadGoogleApis = async () => {
        if (!google) {
            const g = await import('googleapis');
            google = g.google;
            OAuth2 = google.auth.OAuth2;
        }
        return { google, OAuth2 };
    };

    // --- Core Authentication Logic ---

    async function loadSavedCredentialsIfExist() {
        loadEnvs();
        const credentials = envs?.google?.token;
        const webCreds = envs?.google?.web;

        // Need web creds for client creation and either access or refresh token
        if (!webCreds?.client_id || !webCreds?.client_secret || !credentials || (!credentials.access_token && !credentials.refresh_token)) {
            return null;
        }

        try {
            const { google } = await loadGoogleApis();
            const client = google.auth.fromJSON({
                type: 'authorized_user',
                client_id: webCreds.client_id,
                client_secret: webCreds.client_secret,
                refresh_token: credentials.refresh_token,
            });
            // Set access token if available, lib handles expiry
            if (credentials.access_token) {
                client.setCredentials({ access_token: credentials.access_token });
            }
            return client;
        } catch (err) {
            errorCallback('Error loading saved credentials:', err.message);
            return null;
        }
    }

    async function saveCredentials(client) {
        const fs = await loadFs(); // Ensure fs is loaded
        loadEnvs();
        const webCreds = envs?.google?.web;

        if (!webCreds || !client.credentials || (!client.credentials.refresh_token && !client.credentials.access_token)) {
            errorCallback("Cannot save credentials - missing web info or client tokens.");
            return;
        }

        try {
            const payload = {
                type: 'authorized_user',
                client_id: webCreds.client_id,
                client_secret: webCreds.client_secret,
                // Persist existing refresh token if the current client doesn't have one (important after some flows)
                refresh_token: client.credentials.refresh_token || envs.google?.token?.refresh_token,
                access_token: client.credentials.access_token,
            };
            envs.google["token"] = payload;
            // Use async write for slightly better performance, though sync is often acceptable here
            await fs.promises.writeFile("./env.json", JSON.stringify(envs, null, 4));
        } catch (err) {
            errorCallback("Error saving credentials:", err.message);
        }
    }

    async function authorizeDrive() {
        let client = await loadSavedCredentialsIfExist();

        // 1. Test existing client (triggers auto-refresh if needed)
        if (client) {
            try {
                const { google } = await loadGoogleApis();
                const drive = google.drive({ version: 'v3', auth: client });
                await drive.about.get({ fields: 'user' }); // Test call
                // If the call worked, maybe save credentials in case access token was refreshed
                if (client.credentials.access_token) {
                    await saveCredentials(client);
                }
                return client; // Existing/refreshed client is valid
            } catch (err) {
                // Failed validation, proceed to explicit refresh or re-auth
                client = null; // Nullify client to proceed
            }
        }

        // 2. Try explicit refresh if possible
        loadEnvs();
        const refreshToken = envs.google?.token?.refresh_token;
        const webCreds = envs.google?.web;
        if (!client && refreshToken && webCreds?.client_id && webCreds?.client_secret) {
            try {
                const { OAuth2 } = await loadGoogleApis();
                const oAuth2Client = new OAuth2(webCreds.client_id, webCreds.client_secret, webCreds.redirect_uris?.[0]);
                oAuth2Client.setCredentials({ refresh_token: refreshToken });
                const { credentials } = await oAuth2Client.refreshAccessToken();
                oAuth2Client.setCredentials(credentials);
                await saveCredentials(oAuth2Client);
                return oAuth2Client; // Successfully refreshed
            } catch (err) {
                 // Refresh failed, fall through to full auth
                 errorCallback("Explicit token refresh failed:", err.message);
            }
        }

        // 3. Full interactive authorization flow (only in beta)
        loadEnvs(); // Ensure envs are loaded again
        if (!envs.beta) {
            errorCallback("Drive backups need to be fully reauthenticated by hand (run in beta mode).");
            return null;
        }
        if (!webCreds?.client_id || !webCreds?.client_secret || !webCreds?.redirect_uris?.[0]) {
             errorCallback("Cannot initiate authorization: Missing google.web credentials in env.json.");
             return null;
        }

        try {
            const { OAuth2 } = await loadGoogleApis();
            const oAuth2Client = new OAuth2(webCreds.client_id, webCreds.client_secret, webCreds.redirect_uris[0]);
            const authUrl = oAuth2Client.generateAuthUrl({
                access_type: 'offline', scope: googleDriveScope, prompt: 'consent'
            });
            console.log('Authorize this app by visiting this url:', authUrl);

            const process = await loadProcess();
            const code = await new Promise((res) => {
                console.log('Enter the code from that page here:');
                process.stdin.once('data', (data) => res(data.toString().trim()));
            });

            const { tokens } = await oAuth2Client.getToken(code);
             if (!tokens.refresh_token) {
                 console.warn("Authorization successful, but NO refresh token received. Future auth may require manual steps.");
             }
            oAuth2Client.setCredentials(tokens);
            await saveCredentials(oAuth2Client);
            return oAuth2Client;
        } catch (err) {
            errorCallback("Error during interactive authorization:", err.message);
            return null;
        }
    }

    async function reauthenticate() {
        try {
            const client = await authorizeDrive();
            if (!client) {
                errorCallback("ERROR: Failed to authenticate/re-authenticate with Google Drive.");
                googleAuthClient = null;
                googleDrive = null;
                return false;
            }
            googleAuthClient = client;
            const { google } = await loadGoogleApis(); // Ensure google is loaded
            googleDrive = google.drive({ version: 'v3', auth: googleAuthClient });
            return true;
        } catch (e) {
            errorCallback("ERROR: Unexpected error during authentication process:", e);
            googleAuthClient = null;
            googleDrive = null;
            return false;
        }
    }

    // --- Google Drive File Operations ---

    async function uploadTextFile(drive, filePath) {
        const path = await loadPath(); // Ensure path is loaded
        const fs = await loadFs();   // Ensure fs is loaded
        loadEnvs(); // Ensure envs is loaded

        const fileMetadata = {
            name: (envs.beta ? "beta-" : "") + path.basename(filePath),
            parents: [envs.google.folderID]
        };
        const media = {
            mimeType: "text/plain",
            body: fs.createReadStream(filePath),
        };

        try {
            const { google } = await loadGoogleApis(); // Ensure google is loaded
            const response = await drive.files.create({
                resource: fileMetadata, media: media, fields: 'id',
            });
            return response.data.id;
        } catch (error) {
            // Don't log here, let backupToDrive handle logging based on context
            throw error; // Re-throw to be caught by backupToDrive
        }
    }

    async function removeFileFromFolder(drive, folderId, fileId) {
        // This is less critical, simple error handling is fine
        try {
            const { google } = await loadGoogleApis();
            await drive.files.update({ fileId: fileId, removeParents: folderId });
        } catch (err) {
            errorCallback(`Failed to remove file ${fileId} from folder ${folderId}: ${err.message}`);
        }
    }

    async function deleteFileIfExists(drive, folderId, filePath) {
        const path = await loadPath();
        loadEnvs();
        const baseFileName = path.basename(filePath);
        const driveFileName = envs.beta ? "beta-" + baseFileName : baseFileName;

        try {
            const { google } = await loadGoogleApis();
            const res = await drive.files.list({
                q: `'${folderId}' in parents and name='${driveFileName}' and trashed=false`,
                fields: 'files(id, name)',
                spaces: 'drive',
                orderBy: 'createdTime asc', // Oldest first
            });

            const files = res.data.files;
            // Use >= to delete *down to* the desired number - 1
            while (files.length >= numberBackups) {
                const fileToDelete = files.shift(); // Oldest
                try {
                    await drive.files.delete({ fileId: fileToDelete.id });
                } catch (deleteErr) {
                     // If delete fails (e.g. permission), try removing from folder
                     await removeFileFromFolder(drive, folderId, fileToDelete.id);
                }
            }
        } catch (err) {
            errorCallback(`Error listing/deleting old backups for ${driveFileName}: ${err.message}`);
            // Don't stop the backup upload process for list/delete errors generally
        }
    }

    // --- Backup Process ---

    async function backupToDrive(filename, attempt = 0) {
        if (!googleDrive) {
            const authenticated = await reauthenticate();
            if (!authenticated) {
                // Error already logged by reauthenticate
                return false;
            }
        }

        loadEnvs();
        const folderId = envs?.google?.folderID;
        if (!folderId) {
            errorCallback("Cannot backup: Google Drive Folder ID missing in env.json.");
            return false;
        }

        try {
            await deleteFileIfExists(googleDrive, folderId, filename);
            await uploadTextFile(googleDrive, filename);
            // console.log(`Backup of "${filename}" successful.`); // Optional success log
            return true;
        } catch (err) {
            const isAuthError = err.message?.includes('invalid_grant') ||
                                err.message?.includes('Invalid Credentials') ||
                                err.response?.status === 401 ||
                                err.response?.status === 403;

            if (isAuthError && attempt < 1) {
                errorCallback(`Auth error during backup of "${filename}". Re-authenticating...`);
                const reauthenticated = await reauthenticate();
                if (reauthenticated) {
                    return await backupToDrive(filename, attempt + 1); // Retry
                } else {
                     // Error already logged
                    return false;
                }
            } else {
                errorCallback(`Backup error for "${filename}" (Attempt ${attempt + 1}): ${err.message}`);
                if (attempt >= 1 && isAuthError) {
                    errorCallback(`Persistent auth error for "${filename}". Giving up this round.`);
                }
                return false;
            }
        }
    }

    function startBackupThread(filename, msFrequency, userErrorCallback = null, backupNow = false) {
        // Load essential sync modules for setup
        loadFs();
        loadPath();
        loadProcess();
        loadEnvs();

        if (userErrorCallback) {
            errorCallback = userErrorCallback;
        }

        // Initial authentication attempt (async, non-blocking)
        reauthenticate().then(success => {
            if (success && backupNow) {
                setTimeout(() => { backupToDrive(filename); }, 2500); // Keep delay
            } else if (!success) {
                errorCallback("Initial authentication failed. Backups will be attempted on schedule.");
            }
        }).catch(err => {
            errorCallback("Unexpected error during initial authentication:", err);
        });

        // Set interval
        setInterval(() => { backupToDrive(filename); }, msFrequency);

        console.log(`Backup thread started for "${filename}" every ${msFrequency}ms.`);
    }

    // Resolve the main promise with the start function
    resolve(startBackupThread);

});

module.exports = startBackupThreadPromise;