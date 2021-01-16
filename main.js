(function main() {
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
    <button class="${templateClassesPrefix}btn-start ${templateClassesPrefix}button">Continue (import chat)</button>

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


askForUserInput()
    .catch(reason => {}) // we don't have to do anything here – this is to avoid the error when you have an uncaught promise

})()