#!/bin/bash

# WARNING: Do not run this script on machines you are developing from.
# Local changes are overritten


# TODO: we need error handling when an update glitches from trying to start...
#  Otherwise we would have to ssh in to fix it.
#  Maybe force-downgrade to last revision if it couldn't start after 3 attempts after an update?

# This is run from node which is run from cron, so we need to add a few vars to the envirnment
# TODO: Load this in using a file like "bashenv" because most nodes are going to be setup without needing SSH access to the repo 
export PATH=/usr/local/bin/:/usr/bin:/bin:/usr/sbin:/sbin:$PATH
export HOME=/home/guest
eval "$(ssh-agent -s)" > /dev/null 2>&1
ssh-add $HOME/.ssh/GithubKey > /dev/null 2>&1

# Stash changes in worst-case scenario in case someone accidentally runs this while devving.
git stash
# To clean the stash on the main server, run:
# git stash clear

# Now force-update to latest
git fetch origin 2>&1 | grep -v "From github.com"
git reset --hard origin/main

# Install new deps
npm ci

# The bot will quit itself and restart which will apply the new code
exit
