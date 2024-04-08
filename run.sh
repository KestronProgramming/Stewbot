# /bin/sh

while true; do
  git pull
  # Attempt to run bot. Send all errors to a discord logger
  /usr/local/bin/node index.js 2>&1 | ./stderrLog.js

  # Sleep to avoid spamming during a bootloop
  sleep 1
done
