(function main() {

/* ==================== Creating the UI and asking for the user input ==================== */

const templateClassName = 'whatsapp-to-signal-template'
const templateClassesPrefix = 'wts--'

function getOrCreateTemplate() {
    let template = document.querySelector('body > template.' + templateClassName)
    if (template) {
        return template
    } else {
        template = document.createElement('template')
        template.classList.add(templateClassName)
        template.innerHTML = `
<div class="${templateClassesPrefix}wrapper">
    <h2>
        Import whatsapp messages into the chat <span class="${templateClassesPrefix}chatname"></span>
    </h2>

    <p>
        In order to import your whatsapp chat messages, export the chat from whatsapp and upload all of the files using the button below.
    </p>

    <label>
        Upload your files
        <input class="${templateClassesPrefix}files" type="file" multiple>
    </label>

    <button class="${templateClassesPrefix}btn-abort ${templateClassesPrefix}button">Abort (Don't import and close)</button>
    <button class="${templateClassesPrefix}btn-start ${templateClassesPrefix}button">Start (import chat)</button>

    <style>
    .${templateClassesPrefix}wrapper {
        position: fixed;
        top: 5rem;
        right: 5rem;
        bottom: 5rem;
        left: 5rem;

        color: black;
        background-color: white;
        z-index: 100;

        padding: 1rem;
        border-radius: 1rem;
    }
    .${templateClassesPrefix}chatname::After {
        content: var(--chat-name, "No chat is open currently. Please abort this process and re-do it after opening a chat!");
    }
    .${templateClassesPrefix}button {
        padding: 0.5rem;
    }
    </style>
</div>
        `.trim()
        document.body.appendChild(template)
        return template
    }
}

function askForUserInput() {
    return new Promise((resolve, reject) => {
        const template = getOrCreateTemplate()
        const wrapper = document.body.appendChild(template.content.firstChild.cloneNode(true))
        const startEl = wrapper.querySelector(`.${templateClassesPrefix}btn-start`)
        const abortEl = wrapper.querySelector(`.${templateClassesPrefix}btn-abort`)
        const filesEl = wrapper.querySelector(`.${templateClassesPrefix}files`)
        
        const closeImportPopup = () => document.body.removeChild(wrapper)

        let files;

        filesEl.addEventListener('change', event => {
            files = filesEl.files
        })

        abortEl.addEventListener('click', () => {
            closeImportPopup()
            reject()
        })

        startEl.addEventListener('click', async () => {
            const mediaFiles = {}
            let chatLogPromise
               
            for (let i = 0; i < files.length; ++i) {
                const file = files[i]

                if (file.name.startsWith('WhatsApp Chat') && file.name.endsWith('.txt')) {
                    chatLogPromise = file.text()
                } else {
                    mediaFiles[file.name] = file
                }
            }

            closeImportPopup()
            resolve({
                options: {},
                chatLog: await chatLogPromise,
                mediaFiles
            })
        })
    })
}

/* ==================== Parsing the Whatsapp logs ==================== */

const eventStartRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{1,2}), (\d{2}):(\d{2}) - /m
const messageStartRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{1,2}), (\d{2}):(\d{2}) - ([^:]+): (.+)$/m

const messageType = {
    message: "message",
    notification: "notification"
}

function parseLogs({ options, chatLog, mediaFiles }) {
    const logLines = chatLog.split('\n')
    const events = []

    for (line of logLines) {
        if (!eventStartRegex.test(line)) {
            // not an event start -> add to previous event (multi-line)
            events[events.length - 1].text += '\n' + line
        } else {
            const match = line.match(messageStartRegex)
            
            if (match) {
                // message start -> new message
                [ignored, mo, d, y, h, mi, sender, text] = match
                events.push({
                    type: messageType.message,
                    time: new Date(y, mo, d, h, mi, 0, 0),
                    sender,
                    text
                })
            } else {
                // notification (e.g. X created group)
                events.push({
                    type: messageType.notification,
                    text: line.slice(line.indexOf('-') + 2) // +2 to catch - and the space afterwards
                })
            }
        }
    }

    return { events, options, mediaFiles }
}

/* ==================== Filter "Media omitted" ==================== */
/*
    If you choose to export without media, then any messages with media are exported as "<Media omitted>".
    This means that text messages that were sent together with media are NOT exported and hence cannot be restored.
*/

function filterMediaOmitted({ events, options, mediaFiles }) {
    return {
        events: events.filter(ev => ev.text.trim !== '<Media omitted>'),
        options,
        mediaFiles
    }
}

/* ==================== Sending the events as texts ==================== */
const textField = document.querySelector('form.send div.ql-editor[contenteditable="true"][data-placeholder="Send a message"]')
const textFieldToggleSizeButton = document.querySelector('form.send div.module-composition-area__toggle-large > button')
const getSubmitButton = () => document.querySelector('form.send button.module-composition-area__send-button')

// if we can't find the textinput or toggleButton, there is no point in doing anything, so we just notify the user and exit
if (!textField) {
    window.alert(`We couldn't find the input field. Please try again if it's visibile.

If it already visible, please create an issue in the repository. (If you don't know how, please tell this to the trusted friend that read through the code)
Thank you :)`)
    return
}

function requestAfterAnimationFrame() {
    return new Promise((resolve, _) => {
        window.requestAnimationFrame(() => {
            window.setTimeout(resolve)
        })
    })
}

async function pressSubmit() {
    // throughout this function, we'll have to wait for the UI to catch up & draw
    // before we can select certain ui elements
    await requestAfterAnimationFrame()

    // make text field large so we can press the submit button
    textFieldToggleSizeButton.click()

    await requestAfterAnimationFrame()

    // press the submit button
    const submitBtn = getSubmitButton()
    submitBtn.click()

    // let Signal reset after pressing submit
    await requestAfterAnimationFrame()
}

async function sendString(text) {
    if (text.trim() !== '') {
        if (textField.firstChild) {
            textField.removeChild(textField.firstChild)
        }

        for (line of text.split('\n')) {
            const el = document.createElement('div')
            el.setAttribute('dir', 'auto')
            el.innerText = line
            textField.appendChild(el)
        }
        
        await pressSubmit()
    }
}

async function sendMedia({files, text}) {
    // media is currently not supported
    await sendString(text)
}

function enrichWithMediaFiles({ message, options, mediaFiles }) {
    return {hasMedia: false, mediaAndTextPairs: []}
}

async function sendMessage({ message, options, mediaFiles }) {
    const {hasMedia, mediaAndTextPairs} = enrichWithMediaFiles({ message, options, mediaFiles })
    if (hasMedia) {
        for ({files, text} of mediaAndTextPairs) {
            await sendMedia({files, text})
        }
    } else {
        await sendString(message)
    }
}

function turnEventIntoStringBasedOnOptions({ msgEvent, options }) {
    return msgEvent.text
}

async function sendEvents({ events, options, mediaFiles }) {
    let sentEvents = 0

    for (msgEvent of events) {
        if (msgEvent.type === messageType.message) {
            await sendMessage({ message: turnEventIntoStringBasedOnOptions({ msgEvent: msgEvent, options }), options, mediaFiles })
            ++sentEvents
        } else {
            // currently we just don't do anything for notifications
        }
    }

    return sentEvents
}

/* ==================== Putting it all together & calling the methods ==================== */

askForUserInput()
    .then(parseLogs)
    .then(filterMediaOmitted)
    .then(sendEvents)
    .then(sentMessages => {
        window.alert(`Successfully imported ${sentMessages} message(s)`)
    })
    .catch(reason => {}) // we don't have to do anything here – this is to avoid the error when you have an uncaught promise

})()
