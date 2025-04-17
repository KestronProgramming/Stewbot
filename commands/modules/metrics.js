const { InfluxDB, Point, DEFAULT_WriteOptions} = require('@influxdata/influxdb-client')
const { influx } = require('../../data/config')
const { influxToken } = require('../../env.json')

let influxClient, writeApi, connected = false
let pointQueue = []

const ms = require("ms")

async function initInflux() {
    try {
        if (!influxToken) throw new Error("No influx token set in env.json");

        const testConnectOptions = {
            flushInterval: 0,
            maxRetries: 0,
            // https://influxdata.github.io/influxdb-client-js/influxdb-client.writeoptions.html and
            // https://influxdata.github.io/influxdb-client-js/influxdb-client.writeretryoptions.html
        }
        
        influxClient = new InfluxDB({ url: influx.url, token: influxToken })
        writeApi = influxClient.getWriteApi(influx.org, influx.bucket, 's')
        connected = true;
          

        // Test connection to influx to reduce connection warnings
        const originalWarn = console.warn;
        const originalError = console.error;
        console.warn = () => {};
        console.error = () => {};
        let error = false;
        const testConnectionAPI = influxClient.getWriteApi(influx.org, influx.bucket, 's', testConnectOptions)
        testConnectionAPI.writePoint(
            new Point('booted')
                .floatField('duration_ms', 0)
                .timestamp(new Date())
        );
        await testConnectionAPI.flush(false).catch((e) => { error = e });
        console.warn = originalWarn;
        console.error = originalError;
        if (error) throw new Error("Error writing to InfluxDB");


        // Start interval to push points to influx
        setInterval(() => {
            if (connected && pointQueue.length) {
                for (const point of pointQueue) {
                    writeApi.writePoint(point)
                }
                pointQueue = []
                writeApi.flush()
            }
        }, process.env.beta ? ms("1s") : ms("20s"))

        console.beta('[InfluxDB] Connected')
    } catch (e) {
        writeApi = influxClient = undefined;
        connected = false;
        console.beta('[InfluxDB] Connection failed, skipping metrics.')
    }
}

function queueCommandMetric(commandName, durationMs) {
    if (!connected) return
    const point = new Point('discord_command')
        .tag('command', commandName)
        .floatField('duration_ms', durationMs)
        .timestamp(new Date())

    pointQueue.push(point)

    console.beta("New point for command", commandName, "which lasted", ms(durationMs))
}

module.exports = { initInflux, queueCommandMetric }
