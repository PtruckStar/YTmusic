const express = require("express");
const ytdl = require("ytdl-core");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

const app = express();
const jspath = path.join(__dirname, "public");

const getVideoInfo = async id => {
  const videoInfo = await ytdl.getInfo(videoId);
  const {thumbnail, author, title} = videoInfo.videoDetails;
};

// Routes s
app.use(express.static(jspath));

app.get("/stream/:videoId", async (req, res) => {
  const {videoId} = req.params;
  const getAudio = await ytdl(videoId, {
    quality: "highestaudio"
  })

  // Audio format header (OPTIONAL)
  res.set({"Content-Type": "audio/mpeg"});

  // Send compressed audio mp3 data
  const conv = await ffmpeg().input(getAudio).toFormat("mp3")
  conv.pipe(res, { end: true });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Running on ${PORT}`));
