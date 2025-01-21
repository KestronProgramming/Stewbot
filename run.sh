# /bin/sh

# Wait for network connection - in the case of a power outage the router might still be down for a minute
until ping -c 1 1.1.1.1 &> /dev/null
do
    echo "Waiting for wifi..."
    sleep 0.5
done
echo "wifi is up"

# Wait for DNS to connect
until ping -c 1 google.com &> /dev/null
do
    echo "Waiting for DNS..."
    sleep 0.5
done
echo "DNS is up"

# TODO - this needs better handling maybe
export PATH=/usr/bin:/bin:/usr/sbin:/sbin:$PATH

while true; do
  /usr/local/bin/node index.js 2>&1 | ./stderrLog.js
  sleep 1
done
