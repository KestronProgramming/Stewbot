#!/bin/bash

# TODO: we need error handling when it glitches from trying to start...
# Maybe force-downgrade to last revision if it couldn't start after an update?

# TODO: allow flag to return registerCommands

# Pull in from github
git pull

# Install new deps
npm install

# The bot will quit itself and restart which will apply the new code
exit