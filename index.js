const http = require("http");
const fs = require("fs");
const url = require("url");
const requests = require('requests');
require('dotenv').config();  // Load environment variables

// Read the home HTML file
const homeFile = fs.readFileSync("weatherapp.html", "utf-8");

// Function to replace placeholders in the template
const replaceAll = (tempVal, orgVal, errorMsg = "") => {
    let temperature = tempVal.replace("{%temp_val%}", orgVal.main.temp);
    temperature = temperature.replace("{%temp_min%}", orgVal.main.temp_min);
    temperature = temperature.replace("{%temp_max%}", orgVal.main.temp_max);
    temperature = temperature.replace("{%country%}", orgVal.sys.country);
    temperature = temperature.replace("{%location%}", orgVal.name);
    temperature = temperature.replace("{%tempStatus%}", orgVal.weather[0].main);

    // Calculate local time using timezone offset
    const localTime = getLocalTime(orgVal.timezone); // Correctly pass the timezone offset
    temperature = temperature.replace("{%local_time%}", localTime);

    // Add the error message placeholder (if exists)
    temperature = temperature.replace("{%error_message%}", errorMsg);

    return temperature;
};

// Function to get local time of the city using timezone offset (in seconds)
const getLocalTime = (timezoneOffset) => {
    const utcTime = new Date(); // Current UTC time
    const localTime = new Date(utcTime.getTime() + (timezoneOffset * 1000)); // Convert to local time
    return localTime.toLocaleString(); // Return formatted local time
};

const server = http.createServer((req, res) => {
    const query = url.parse(req.url, true).query;
    const city = query.city || "Mumbai"; // Default to Mumbai if no city is provided

    if (req.url.startsWith("/")) {
        const apiKey = process.env.API_KEY; // Fetch the API key from the .env file
        if (!apiKey) {
            res.writeHead(500, { "Content-Type": "text/plain" });
            return res.end("API key is missing. Please check your .env file.");
        }

        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

        // Send request to OpenWeather API
        requests(apiUrl)
            .on('data', (chunk) => {
                try {
                    const weatherData = JSON.parse(chunk);

                    // Handle error if city is not found
                    if (weatherData.cod !== 200) {
                        res.writeHead(200, { "Content-Type": "text/html" });
                        const errorData = replaceAll(homeFile, {
                            main: { temp: "-", temp_min: "-", temp_max: "-" },
                            sys: { country: "-" },
                            name: "-",
                            weather: [{ main: "-" }],
                            timezone: 0
                        }, "City not found or invalid city name.");
                        return res.end(errorData);
                    }

                    // Success: Send weather data to the frontend
                    const realTimeData = replaceAll(homeFile, weatherData);
                    res.writeHead(200, { "Content-Type": "text/html" });
                    res.write(realTimeData);
                } catch (error) {
                    res.writeHead(500, { "Content-Type": "text/plain" });
                    return res.end("Error parsing weather data.");
                }
            })
            .on('end', (err) => {
                if (err) {
                    console.log('Connection closed due to errors', err);
                    res.writeHead(500, { "Content-Type": "text/plain" });
                    return res.end("Error fetching weather data");
                }
                res.end();
            });
    } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
    }
});

// Start the server
server.listen(8006, "127.0.0.1", () => {
    console.log("Listening to port no 8006");
});
