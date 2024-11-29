import taskManager from "./taskManager.js"
const fileInput = document.querySelector('#fileInput')

function createGroup(id) {
    const rootDiv = document.createElement('div')
    rootDiv.id = `root-${id}`
    rootDiv.innerHTML = `<button>Colorize</button><div class='root-gallery'></div>`
    document.querySelector('#output-container').appendChild(rootDiv)
    return rootDiv.id
}

function showCase(rootDivId, dataURL, titleText) {
    // Create a container div to hold the title and image
    const container = document.createElement('div')
    container.classList.add('image-container')

    // Create a title element
    const title = document.createElement('div')
    title.classList.add('image-title')
    title.textContent = titleText

    // Create an image element
    const img = document.createElement('img')
    img.src = dataURL
    img.alt = 'Image'
    img.classList.add('resized-image')

    // Append the title and image to the container
    container.appendChild(title)
    container.appendChild(img)

    // Append the container to the output area
    const rootDiv = document.getElementById(rootDivId)
    rootDiv.querySelector('.root-gallery').appendChild(container)
}

function drawImgOnCanvas(img) {
    const canvas = document.createElement('canvas')
    // use simple height & width for faster raster
    canvas.width = img.naturalWidth //naturalWidth
    canvas.height = img.naturalHeight //naturalHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas
}

function imageDataToDataUrl(imageData) {
    // Create a canvas element
    const canvas = document.createElement('canvas')
    canvas.width = imageData.width
    canvas.height = imageData.height
    const ctx = canvas.getContext('2d')

    // Put the ImageData onto the canvas
    ctx.putImageData(imageData, 0, 0)

    // Convert the canvas to a Data URL
    const dataURL = canvas.toDataURL('image/png') // You can specify 'image/jpeg' if preferred
    return dataURL
}

function processImage() {
    const rootDiv = this.parentNode
    const orgImg = rootDiv.querySelector('img')
    const canvas = drawImgOnCanvas(orgImg)
    const ctx = canvas.getContext('2d')
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    // send imageData to worker
    taskManager.addTask(rootDiv.id, rootDiv.id, imageData)
}

function readFile(file){
    const reader = new FileReader()
    reader.onload = function (e) {
        const img = new Image()
        img.onload = function () {
            const rootDivId = createGroup(
                `${file.name.toLowerCase()}-${new Date().getTime()}`
            )
            const button = document
                .getElementById(rootDivId)
                .querySelector('button')
            showCase(rootDivId, img.src, 'Original Image')
            button.addEventListener('click', processImage)
            setTimeout(e=>{
                button.click();
            },100)
        }
        img.src = e.target.result
    }
    reader.readAsDataURL(file)
}

// Event listener to handle file input
fileInput.addEventListener("change", event => {
    const files = [...event.target.files]
    if (!files.length) return
    files.map(readFile)
})

taskManager.on("updateUI", (e) => {
    switch (e.type) {
        case "progress":
            // console.log("progress: ", e.progress.message);
            break;

        case "taskCompleted":
            const { parentId, processedImage } = e.payload
            showCase(parentId, imageDataToDataUrl(processedImage), "Binary Image")
            break;

        case "error":
            console.error("error", e);
            break;

        default:
            console.warn("Unknown message type:", e);
    }
})
console.log(taskManager)
if (typeof Worker !== 'undefined') {
    console.log('Web Workers are supported in this browser.')
} else {
    console.log('Web Workers are not supported in this browser.') // use toast notification
}