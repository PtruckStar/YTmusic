const app = require("express")();
const ytdl = require("ytdl-core");
const path = require("path");

app.get("/stream/:videoId", async(req, res) => {
  const { videoId } = req.params
  const isValid = ytdl.validateID(videoId)

  if (!isValid) {
    throw new Error()
  }

  const videoInfo = await ytdl.getInfo(videoId)
  let audioFormat = ytdl.chooseFormat(videoInfo.formats, {
    filter: "audioonly",
    quality: "highestaudio"
  });

  const { itag, container, contentLength } = audioFormat

  var start;
  var end;
  var total = 0;
  var contentRange = false;
  var content_length = 0;

  var range = req.headers.range;
  if (range) {
    var positions = range.replace(/bytes=/, "").split("-");
    start = parseInt(positions[0], 10);
    total = contentLength;
    end = positions[1] ? parseInt(positions[1], 10) : total - 1;
    var chunksize = (end - start) + 1;
    contentRange = true;
    content_length = chunksize;
  } else {
    start = 0;
    end = contentLength;
    content_length = contentLength;
  }

  if (start <= end) {
    var responseCode = 200;
    var responseHeader = {
      "Accept-Ranges": "bytes",
      "Content-Length": content_length,
      "Content-Type": `audio/${container}`
    };
    if (contentRange) {
      responseCode = 206;
      responseHeader["Content-Range"] = "bytes " + start + "-" + end + "/" + total;
    }
    res.writeHead(responseCode, responseHeader);

    const range = { start: start, end: end }
    //const audioStream = ytdl(videoId, { filter: format => format.itag === itag, range })

    var stream = ytdl(videoId, { filter: format => format.itag === itag, range })
      .on("readable", function() {
        var chunk;
        while (null !== (chunk = stream.read(1024))) {
          res.write(chunk);
        }
      }).on("error", function(err) {
        res.end(err);
      }).on("end", function(err) {
        res.end();
      });
  } else {
    return res.status(403).send();
  }
});

const playerView = (req, res) => {
  res.sendFile(path.resolve("player-safari.html"));
}
app.get('/', playerView)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
   console.log("localhost: port 4000")
   //safari.open(url+"/info?url=https://www.youtube.com/watch?v=6Nb-prB-4P0");
 });
