(function main() {

/* ==================== Add prefix based on user input ==================== */
// this section needs to be up here, so we can use the preview in the ui
const messageType = {
    message: "message",
    notification: "notification"
}

function transformEventIntoStringWithPrefix({ event: { type, time, sender, text }, options }) {
    if (type === messageType.message) {
        const prefix = options.prefixTemplate
            .replace('{sender}', sender)
            .replace('{YY}', time.getFullYear())
            .replace('{MM}', time.getMonth().toString().padStart(2, '0'))
            .replace('{M}', time.getMonth())
            .replace('{DD}', time.getDay().toString().padStart(2, '0'))
            .replace('{D}', time.getDay())
            .replace('{HH}', time.getHours().toString().padStart(2, '0'))
            .replace('{H}', time.getHours())
            .replace('{mm}', time.getMinutes().toString().padStart(2, '0'))
            .replace('{m}', time.getMinutes())
        return prefix + text
    } else {
        return text
    }
}

/* ==================== Creating the UI and asking for the user input ==================== */

const templateClassName = 'whatsapp-to-signal-template'
const templateClassesPrefix = 'wts--'
const chatNameCssVariableName = '--' + templateClassesPrefix + 'chat-name'

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
        Import whatsapp messages to "<span class="${templateClassesPrefix}highlight ${templateClassesPrefix}chatname"></span>"
    </h2>

    <p>
        In order to import your whatsapp chat messages, export the chat from whatsapp and upload all of the files using the button below.
    </p>

    <label>
        Upload your files
        <input class="${templateClassesPrefix}files" type="file" multiple>
    </label>

    <p>
        With the following option, you can define prefixes that should be added in front of every message based on some information of the original message:
        Simple write the text in the below textbox and it will be prepended to every message.
        <span class="${templateClassesPrefix}highlight">(Note: Don't forget to add a space after the text, if you want to separate the prefix from the message a bit)</span>
    </p>

    <p>
        The prefix also supports so-called placeholders.
        There are a few keywords, that if found in the text will be replaced with certain information about the text.
        These words are: (include the brackets)<br/>
        <span class="${templateClassesPrefix}highlight">{sender}</span>: The sender of the original message as saved in the export<br/>
        <span class="${templateClassesPrefix}highlight">{YY}</span>: The year it was sent in the format of e.g. "20" for the year 2020<br/>
        <span class="${templateClassesPrefix}highlight">{MM}</span>: The month it was sent in the format of e.g. "01" for january<br/>
        <span class="${templateClassesPrefix}highlight">{M}</span>: The month it was sent in the format of e.g. "1" for january<br/>
        <span class="${templateClassesPrefix}highlight">{DD}</span>: The day it was sent in the format of e.g. "01"<br/>
        <span class="${templateClassesPrefix}highlight">{D}</span>: The day it was sent in the format of e.g. "1"<br/>
        <span class="${templateClassesPrefix}highlight">{HH}</span>: The hour it was sent in the format of e.g. "01"<br/>
        <span class="${templateClassesPrefix}highlight">{H}</span>: The hour it was sent in the format of e.g. "1"<br/>
        <span class="${templateClassesPrefix}highlight">{mm}</span>: The minute it was sent in the format of e.g. "01"<br/>
        <span class="${templateClassesPrefix}highlight">{m}</span>: The minute it was sent in the format of e.g. "1"<br/>
    </p>

    <label>
        Prefix format
        <input class="${templateClassesPrefix}option-prefix" type="text">
    </label>

    <p>
        <span class="${templateClassesPrefix}highlight">Example message:</span>
        <span class="${templateClassesPrefix}option-prefix-preview"></span>
    <p/>

    <div class="${templateClassesPrefix}button-wrapper">
        <button class="${templateClassesPrefix}btn-abort ${templateClassesPrefix}button">Abort (Don't import and close)</button>
        <button class="${templateClassesPrefix}btn-start ${templateClassesPrefix}button">Start (import chat)</button>
    </div>

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
        overflow: hidden;

        padding: 1rem;
        border-radius: 1rem;
    }
    .${templateClassesPrefix}highlight {
        font-weight: bold;
    }
    .${templateClassesPrefix}chatname::After {
        content: var(${chatNameCssVariableName}, "No chat is open currently. Please abort this process and re-do it after opening a chat!");
    }
    .${templateClassesPrefix}button-wrapper {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;

        display: flex;
    }
    .${templateClassesPrefix}button {
        padding: 1rem;
        flex: 1;
    }
    .${templateClassesPrefix}button:hover {
        background-color: dark-grey;
    }
    </style>
</div>
        `.trim()
        document.body.appendChild(template)
        return template
    }
}

function updateChatNameCssVariable() {
    const name = document.querySelector('div.module-conversation-header__title').firstChild.data
    document.body.style.setProperty(chatNameCssVariableName, '"' + name + '"')
}

function askForUserInput() {
    return new Promise((resolve, reject) => {
        const template = getOrCreateTemplate()
        const wrapper = document.body.appendChild(template.content.firstChild.cloneNode(true))
        const startEl = wrapper.querySelector(`.${templateClassesPrefix}btn-start`)
        const abortEl = wrapper.querySelector(`.${templateClassesPrefix}btn-abort`)
        const filesEl = wrapper.querySelector(`.${templateClassesPrefix}files`)
        const prefixEl = wrapper.querySelector(`.${templateClassesPrefix}option-prefix`)
        const previewEl = wrapper.querySelector(`.${templateClassesPrefix}option-prefix-preview`)
        
        const closeImportPopup = () => document.body.removeChild(wrapper)

        function loadOptions() {
            return {
                prefixTemplate: prefixEl.value ?? ''
            }
        }

        let files;

        filesEl.addEventListener('change', event => {
            files = filesEl.files
        })

        abortEl.addEventListener('click', () => {
            closeImportPopup()
            reject()
        })

        startEl.addEventListener('click', async () => {
            if (!files || files.length == 0) {
                window.alert('Please first upload your files')
                return
            }

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
                options: loadOptions(),
                chatLog: await chatLogPromise,
                mediaFiles
            })
        })

        // update prefix preview
        function updatePreview() {
            previewEl.innerText = transformEventIntoStringWithPrefix({
                options: loadOptions(),
                event: { type: messageType.message, sender: 'Oscar', text: "Happy new Year!", time: new Date(2020, 1, 1, 0, 1, 8) }
            })
        }

        prefixEl.addEventListener('input', updatePreview)

        updatePreview()
        updateChatNameCssVariable()
    })
}

/* ==================== Parsing the Whatsapp logs ==================== */

const eventStartRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{1,2}), (\d{2}):(\d{2}) - /m
const messageStartRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{1,2}), (\d{2}):(\d{2}) - ([^:]+): (.+)$/m

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
                const [ignored, mo, d, y, h, mi, sender, text] = match
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
const getDropZone = () => document.querySelector('div.conversation-stack > div.conversation.group')

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
    getSubmitButton().click()

    // let Signal reset after pressing submit
    await requestAfterAnimationFrame()
}

async function sendString(text, alwaysSubmit) {
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
    } else if (alwaysSubmit) {
        await pressSubmit()
    }
}

async function sendMedia({ file, overrideName, message }) {
    if (!file) {
        console._error(`Could not find file '${overrideName}'`)
    } else {
        const renamedFile = overrideName == undefined
            ? file
            : new File([file], overrideName, { type: file.type, lastModified: file.lastModified })

        // using the dropping api integration of Signal
        let customEvent = new CustomEvent('drop')
        customEvent.dataTransfer = {
            types: [ 'Files' ],
            files: [ renamedFile ]
        }

        getDropZone().dispatchEvent(customEvent)
        
        await new Promise(resolve => setTimeout(resolve, 1000))

        await sendString(message, true)

        await new Promise(resolve => setTimeout(resolve, 1000))
    }
}

const fileAttachedMarker = '(file attached)'
function enrichWithMediaFiles({ message, options, mediaFiles }) {
    const [firstLine, ...tail] = message.split('\n')

    if (!firstLine.endsWith(fileAttachedMarker)) {
        // no media found
        return { hasMedia: false }
    } else {
        // media found
        const fileName = firstLine.substring(0,  message.indexOf(fileAttachedMarker)).trim()

        if (fileName.endsWith('.') && tail.length > 0) {
            // files that are sent as files and not seen as images/videos/gifs have no file ending and their
            // original file name is instead sent as the message text
            // when exporting the suffix '.bin' is added – resulting in file named e.g. 'DOC-20210212-WA0001..bin'
            const actualFileName = fileName + '.bin'
            const originalFileName = tail[0]
            const restOfMessage = tail.slice(1).join('\n')

            if (tail.length > 1) {
                console._warn('Hey it seems that in your logs, there was a file that was sent together with a message. I thought that was impossible. Please open a ticket (and if you\'re fine with it include the offending part or something of the same format)')
                console._warn('internal file name: ' + fileName + '(.bin) (file ' + (mediaFiles.hasOwnProperty(actualFileName) ? 'exists' : 'doesn\'t exist') + ')'
                    + '\nassumed actual file name: ' + originalFileName + ' (file ' + (mediaFiles.hasOwnProperty(originalFileName) ? 'exists' : 'doesn\'t exist') + ')'
                    + '\nfull message: ' + message
                )
            }

            return {
                hasMedia: true,
                file: mediaFiles[actualFileName],
                overrideName: originalFileName,
                message: restOfMessage
            }

        } else {
            const messageText = tail.join('\n')
            return {
                hasMedia: true,
                file: mediaFiles[fileName],
                message: messageText
            }
        }
    }
}

function turnEventIntoStringBasedOnOptions({ msgEvent, options }) {
    return transformEventIntoStringWithPrefix({event: msgEvent, options})
}

async function sendMessage({ msgEvent, options, mediaFiles }) {
    const {hasMedia, file, overrideName, message: mediaMessage} = enrichWithMediaFiles({ message: msgEvent.text, options, mediaFiles })
    if (hasMedia) {
        await sendMedia({
            file,
            overrideName,
            message: turnEventIntoStringBasedOnOptions({ msgEvent: { ...msgEvent, text: mediaMessage }, options })
        })
    } else {
        await sendString(turnEventIntoStringBasedOnOptions({ msgEvent: msgEvent, options }))
    }
}

async function sendEvents({ events, options, mediaFiles }) {
    let sentEvents = 0

    for (msgEvent of events) {
        if (msgEvent.type === messageType.message) {
            await sendMessage({ msgEvent, options, mediaFiles })
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
