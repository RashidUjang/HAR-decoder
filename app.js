const fs = require("fs");

const base64 = require("base-64");
const utf8 = require("utf8");

const JSONFiles = [];

async function main() {
  const files = await fs.promises.readdir("./data");

  for (let file of files) {
    let fileBuffer = fs.readFileSync(`./data/${file}`, "utf-8");
    JSONFiles.push(JSON.parse(fileBuffer));
  }

  for (let [i, file] of JSONFiles.entries()) {
    let m3u8File = {};
    const tsFiles = [];

    for (entry of file.log.entries) {
      if (entry._resourceType === "xhr") {
        let fileExtensionTemp = entry.request.url.split(".");
        let fileExtension = fileExtensionTemp[fileExtensionTemp.length - 1];

        if (fileExtension === "ts") {
          try {
            let buff = Buffer.from(entry.response.content.text, "base64");
            tsFiles.push(buff);
          } catch (err) {
            console.log(err);
          }
        }

        if (fileExtension === "m3u8") {
          let bytes = base64.decode(entry.response.content.text);
          m3u8File = utf8.decode(bytes);
        }
      }
    }
    try {
      await fs.promises.mkdir(`./output/video${i}`);
    } catch (err) {
      console.log(err);
    }

    // Combine segment into one file
    for ([v, tsSegment] of tsFiles.entries()) {
      fs.writeFileSync(`./output/video${i}/video${v}.ts`, tsSegment, "binary");
    }

    fs.writeFileSync(`./output/video${i}/video.m3u8`, m3u8File);
  }
}

main();
