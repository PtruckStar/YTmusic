const app = require("express")()
const ytdl = require("ytdl-core")
const path = require("path")

const getInfo = async (req, res) => {

    try {
        const { url } = req.query
        const videoId = ytdl.getURLVideoID(url)

        const videoInfo = await ytdl.getInfo(videoId)
        const { thumbnail, author, title } = videoInfo.videoDetails

        let audioFormat;
        let filteredMP4Audio = videoInfo.formats.filter(
            v => v.hasVideo == false && v.hasAudio == true && v.container == 'mp4'
        );
        audioFormat = ytdl.chooseFormat(filteredMP4Audio, {
            filter: "audioonly",
            quality: "highestaudio"
        });
        if (!audioFormat) {
            // Fallback format
            audioFormat = ytdl.chooseFormat(videoInfo.formats, {
                filter: "audioonly",
                quality: "highestaudio"
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                url: audioFormat.url,
                thumbnail: thumbnail['thumbnails'][0].url || null,
                videoId, author: author ? author['name'] : null, title
            }
        })

    } catch (error) {
        console.log(`error --->`, error);
        return res.status(500).json({ success: false, msg: "Failed to get video info" })
    }

}

const vlc_api = async (req, res) => {
  try {
    const {url} = req.query;
    const videoId = ytdl.getURLVideoID(url);
    const videoInfo = await ytdl.getInfo(videoId);
    const {thumbnail, author, title} = videoInfo.videoDetails;
    const audioFormat = ytdl.chooseFormat(videoInfo.formats, {
      filter: "audioonly",
      quality: "highestaudio"
    });
    res.setHeader('Content-Type', 'application/json');
    res.json({
      success: true,
      data: {
        url: audioFormat.url,
        thumbnail: thumbnail["thumbnails"][0].url || null,
        videoId,
        author: author ? author["name"] : null,
        title
      }
    });
  } catch (error) {
    console.log(`error --->`, error);
    return res.status(500).json({success: false, msg: "Failed to get video info"});
  }
};

const playerView = (req, res) => {
  res.sendFile(path.resolve("./player.html"));
};

// Routes s
app.get("/api", vlc_api)
app.get("/info", getInfo)
app.get('/', playerView)



const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`Running on ${PORT}`))
