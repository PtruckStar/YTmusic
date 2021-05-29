const app = require("express")();
const ytdl = require("ytdl-core");
const path = require("path")

app.get("/stream/:videoId", async (req, res) => {
  const { videoId } = req.params;
  const isValid = ytdl.validateID(videoId);

  if (!isValid) {
    throw new Error();
  }

  const videoInfo = await ytdl.getInfo(videoId);

  let audioFormat = ytdl.chooseFormat(videoInfo.formats, {
    filter: "audioonly",
    quality: "highestaudio",
  });

  const { itag, container, contentLength } = audioFormat;

  // Listing 3.
  const options = {};

  let start;
  let end;

  const range = req.headers.range;
  if (range) {
    const bytesPrefix = "bytes=";
    if (range.startsWith(bytesPrefix)) {
      const bytesRange = range.substring(bytesPrefix.length);
      const parts = bytesRange.split("-");
      if (parts.length === 2) {
        const rangeStart = parts[0] && parts[0].trim();
        if (rangeStart && rangeStart.length > 0) {
          options.start = start = parseInt(rangeStart);
        }
        const rangeEnd = parts[1] && parts[1].trim();
        if (rangeEnd && rangeEnd.length > 0) {
          options.end = end = parseInt(rangeEnd);
        }
      }
    }
  }

  res.setHeader("content-type", `audio/${container}`);

  // Listing 4.
  if (req.method === "HEAD") {
    res.statusCode = 200;
    res.setHeader("accept-ranges", "bytes");
    res.setHeader("content-length", contentLength);
    res.end();
  } else {
    // Listing 5.
    let retrievedLength;
    if (start !== undefined && end !== undefined) {
      retrievedLength = end + 1 - start;
    } else if (start !== undefined) {
      retrievedLength = contentLength - start;
    } else if (end !== undefined) {
      retrievedLength = end + 1;
    } else {
      retrievedLength = contentLength;
    }

    // Listing 6.
    res.statusCode = start !== undefined || end !== undefined ? 206 : 200;

    res.setHeader("content-length", retrievedLength);

    if (range !== undefined) {
      res.setHeader(
        "content-range",
        `bytes ${start || 0}-${end || contentLength - 1}/${contentLength}`
      );
      res.setHeader("accept-ranges", "bytes");
    }

    // Listing 7.
    const ranges = { start: start, end: end }
    const audioStream = ytdl(videoId, { filter: format => format.itag === itag, ranges })
    audioStream.pipe(res)
  }
});

const playerView = (req, res) => {
    res.sendFile(path.resolve("player.html"));
}
app.get('/', playerView)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
   console.log("localhost: port 4000")
   //safari.open(url+"/info?url=https://www.youtube.com/watch?v=6Nb-prB-4P0");
 });
