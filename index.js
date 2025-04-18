require('dotenv').config();
const http = require("http");
const fs = require("fs");
const url = require("url");
const axios = require("axios"); // Replacing `requests`

const homeFile = fs.readFileSync("weatherapp.html", "utf-8");

// Function to replace placeholders
const replaceAll = (tempVal, orgVal = {}, errorMsg = "") => {
    const main = orgVal.main || {};
    const sys = orgVal.sys || {};
    const weather = (orgVal.weather && orgVal.weather[0]) || {};
    
    let temperature = tempVal.replace("{%temp_val%}", main.temp || "-");
    temperature = temperature.replace("{%temp_min%}", main.temp_min || "-");
    temperature = temperature.replace("{%temp_max%}", main.temp_max || "-");
    temperature = temperature.replace("{%country%}", sys.country || "-");
    temperature = temperature.replace("{%location%}", orgVal.name || "-");
    temperature = temperature.replace("{%tempStatus%}", weather.main || "-");

    const localTime = getLocalTime(orgVal.timezone || 0);
    temperature = temperature.replace("{%local_time%}", localTime);
    temperature = temperature.replace("{%error_message%}", errorMsg);

    return temperature;
};

// Function to calculate local time
const getLocalTime = (timezoneOffset) => {
    const utcTime = new Date();
    const localTime = new Date(utcTime.getTime() + (timezoneOffset * 1000));
    return localTime.toLocaleString();
};

// Create server
const server = http.createServer(async (req, res) => {
    const query = url.parse(req.url, true).query;
    const city = query.city || "Mumbai";
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        return res.end("API key is missing. Please check your .env file.");
    }

    if (req.url.startsWith("/")) {
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

        try {
            const response = await axios.get(apiUrl);
            const weatherData = response.data;

            if (weatherData.cod !== 200) {
                res.writeHead(200, { "Content-Type": "text/html" });
                const errorData = replaceAll(homeFile, {}, "City not found or invalid city name.");
                return res.end(errorData);
            }

            const realTimeData = replaceAll(homeFile, weatherData);
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(realTimeData);
        } catch (error) {
            res.writeHead(500, { "Content-Type": "text/plain" });
            return res.end("Error fetching weather data.");
        }
    } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
    }
});

// Start server
server.listen(8006, "0.0.0.0", () => {
    console.log("Listening to port no 8006");
});
