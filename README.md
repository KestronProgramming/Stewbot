# Stewbot
This is the open source repository for Stewbot, an advanced Discord bot with the intention of helping keep your server running smoothly while also providing entertainment.
Stewbot is completely open source and free.

## Links
- [App Directory](https://discord.com/discovery/applications/966167746243076136)
- [Website](https://stewbot.kestron.software)
- [Support Server](https://discord.gg/k3yVkrrvez)

## Running Locally
To run this code with your own keys, make sure you have node installed, and then you need to make a file called "env.json" this root directory, and add the following fields:

```json
{
    "token": "<Discord Bot Token>",
    "clientId": "<Discord Bot ID>",
    "noticeChannel": "<Channel for bot updates>",
    "logWebhook": "<Webhook to log errors, etc>",
    "wyrKey": "<Rapid-API key for WYRs>",
    "google": {
        "web": {
            "client_id": "<Google Client-ID>",
            "project_id": "<Project-ID>",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_secret": "<Client-Secret>",
            "redirect_uris": [
                "https://developers.google.com/oauthplayground"
            ]
        },
        "folderID": "<Google-Drive folder for backups>"
    }
}
```

The Discord fields allow for the bot to run. The rapid API key is needed for Would You Rather prompts. The Google secrets are needed to backup the database to Google Drive.

Make sure to run `npm install`, and `node launchCommands.js` before you start the bot to register command on discord. Start the bot with `./run.sh` on Linux, or `node index.js` on Windows.