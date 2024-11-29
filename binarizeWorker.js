importScripts("./binarize.js")
class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, listener) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(listener);
    }

    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach((listener) => listener(data));
        }
    }
}

self.onmessage = async function (e) {
    let data = {};
    switch (e.data.type) {
        case "other1":
            data = {
                type: "progress",
                taskId: taskId,
                payload: {
                    parentId: parentId,
                    meta: 0
                }
            }
            break;

        case "task":
            // let threshold = otsuThreshold(imageData);            
            const { imageData, parentId, taskId } = e.data.payload;
            try {
                const result = await applyThreshold(imageData, (progress) => {
                    // Send progress update to main thread
                    self.postMessage({
                        type: "progress",
                        taskId: taskId,
                        parentId: parentId,
                        progress,
                    });
                });

                // Send final result
                self.postMessage({
                    type: "taskCompleted",
                    taskId: taskId,
                    payload: {
                        parentId: parentId,
                        processedImage: imageData
                    }
                });
            } catch (error) {
                self.postMessage({
                    type: "error",
                    taskId: taskId,
                    parentId: parentId,
                    payload: { error: error.message },
                });
            }
            break;

        case "other2":
            console.error(`Task ${taskId} failed: ${payload.error}`);
            break;

        default:
            console.warn("[WorkerScript]: Unknown message type:", type);
    }    
};
