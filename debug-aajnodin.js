const https = require("https");
const fs = require("fs");

const url = "https://aajnodin.com/?gdate=2026-01-28";

https
  .get(url, (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      // Look for "Hijri" or "Shabaan"
      const regex = /<div[^>]*>.*?Hijri.*?<\/div>/is;
      // Just dump the whole thing to a file first, searching in text is better
      fs.writeFileSync("aajnodin.html", data);
      console.log("Downloaded HTML to aajnodin.html");
    });
  })
  .on("error", (err) => {
    console.log("Error: " + err.message);
  });
