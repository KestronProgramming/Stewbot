const { InfluxDB, Point } = require('@influxdata/influxdb-client')
const { influx } = require('../../data/config')
const { influxToken } = require('../../env.json')

let influxClient, writeApi, connected = false
let pointQueue = []

const ms = require("ms")

function initInflux() {
    try {
        influxClient = new InfluxDB({ url: influx.url, token: influxToken })
        writeApi = influxClient.getWriteApi(influx.org, influx.bucket, 's')
        connected = true

        // Flush every 5s if there are points
        setInterval(() => {
            if (connected && pointQueue.length) {
                for (const point of pointQueue) {
                    writeApi.writePoint(point)
                }
                pointQueue = []
                writeApi.flush()
            }
        }, process.env.beta ? ms("1s") : ms("20s"))

        console.log('[InfluxDB] Connected')
    } catch (e) {
        console.warn('[InfluxDB] Connection failed, skipping metrics.')
        console.beta(e);
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
