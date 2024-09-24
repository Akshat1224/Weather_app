const http = require("http");
const fs = require("fs");
const url = require("url");
var requests = require('requests');

const homeFile = fs.readFileSync("weatherapp.html", "utf-8");

const replaceAll = (tempVal, orgVal) => {
    let temperature = tempVal.replace("{%temp_val%}", orgVal.main.temp);
    temperature = temperature.replace("{%temp_min%}", orgVal.main.temp_min);
    temperature = temperature.replace("{%temp_max%}", orgVal.main.temp_max);
    temperature = temperature.replace("{%country%}", orgVal.sys.country);
    temperature = temperature.replace("{%location%}", orgVal.name);
    temperature = temperature.replace("{%tempStatus%}", orgVal.weather[0].main);
    return temperature;
}

const server = http.createServer((req, res) => {
    const query = url.parse(req.url, true).query;
    const city = query.city || "Mumbai";  // Default to Mumbai if no city is provided
    
    if (req.url.startsWith("/")) {
        requests(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=d26c885fbfe4857715a829da9651f685&units=metric`)
            .on('data', (chunk) => {
                const weatherData = JSON.parse(chunk);
                const arrData = [weatherData];
                const realTimeData = arrData.map((val) => replaceAll(homeFile, val)).join("");
                res.write(realTimeData);
            })
            .on('end', (err) => {
                if (err) {
                    console.log('connection closed due to errors', err);
                    res.end("Error fetching weather data");
                }
                res.end();
            });
    } else {
        res.end("404 Not Found");
    }
});

server.listen(8006, "127.0.0.1", () => {
    console.log("Listening to port no 8006");
});
