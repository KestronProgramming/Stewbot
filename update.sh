#!/bin/bash

# WARNING: Do not run this script on machines you are developing from.
# Local changes are overritten


# TODO: we need error handling when an update glitches from trying to start...
#  Otherwise we would have to ssh in to fix it.
#  Maybe force-downgrade to last revision if it couldn't start after 3 attempts after an update?


# Stash changes - these can be recoverd worst-case scenario
git stash

# Pull in from github
git pull

# Install new deps
npm install

# The bot will quit itself and restart which will apply the new code
exit