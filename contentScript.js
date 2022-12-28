(() => {
    let youtubeLeftControls, youtubePlayer
    let currentVideo = ""
    let currentVideoBookmarks = []

    chrome.runtime.onMessage.addListener((obj ,sender, response) => {
        const { type, value, videoId } = obj

        if(type === "NEW") {
            currentVideo = videoId
            newVideoLoaded()
        } else if (type === "PLAY") {
            youtubePlayer.currentTime = value
        } else if (type === "DELETE") {
            currentVideoBookmarks = currentVideoBookmarks.filter(b => b.time != value)
            chrome.storage.sync.set({ [currentVideo]: JSON.stringify(currentVideoBookmarks)})

            response(currentVideoBookmarks)
        }
    })

    const fetchBookmarks = () => {
        return new Promise((resolve) => {
            chrome.storage.sync.get([currentVideo], obj => {
                resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : [])
            })
        })
    }

    const newVideoLoaded = async () => {
        const bookmartBtnExists = document.getElementsByClassName("bookmark-btn")[0]
        currentVideoBookmarks = await fetchBookmarks()

        if(!bookmartBtnExists) {
            const bookmartBtn = document.createElement("img")

            bookmartBtn.src = chrome.runtime.getURL("assets/bookmark.png")
            bookmartBtn.className = "ytp-button" + "bookmark-btn"
            bookmartBtn.title = "Click to bookmark current timestamp"

            youtubeLeftControls = document.getElementsByClassName("ytp-left-controls")[0]
            youtubePlayer = document.getElementsByClassName("video-stream")[0]

            youtubeLeftControls.appendChild(bookmartBtn)
            bookmartBtn.addEventListener("click", addNewBookmarkEventHandler)
        }
    }
    const addNewBookmarkEventHandler = async () => {
        const currentTime = youtubePlayer.currentTime
        const newBookmark = {
            time: currentTime,
            desc: "Bookmark at " + getTime(currentTime),
        }

        currentVideoBookmarks = await fetchBookmarks()

        chrome.storage.sync.set({
            [currentVideo]: JSON.stringify([...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time))
        })
    }
})()

const getTime = t => {
    let date = new Date(0)
    date.setSeconds(t)

    return date.toISOString().substr(11, 9)
}
