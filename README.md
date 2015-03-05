# sierra-scrape
A simple node script to scrape bib information from Innovative's Sierra ILS

To Use:
Make sure you have Node.js and NPM installed.

Edit the config/default.json file for your config.
```json
{
  "API": {
  	"key": "",
  	"secret" : "",
  	"base" : "https://lib.example.edu/iii/sierra‑api/v1/",
  	"perRequest" : 100,
  	"IdStart" : 0
  }
}
```
key + secrete: Your API credentials.

base: The base URL to the API endpoint.

perRequest: How many records to ask for per call, based on your server's performance.

IdStart: The bib ID to start with, incase you need to stop the script before it is finished.


```
npm install
node scrape.js
```

It will make a directory called data and will be filled with json files.

