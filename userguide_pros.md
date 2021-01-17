# Userguide for the "Pros"

> If you are not comfortable reading JavaScript and/or using the developer console, see the [more extensive user guide](userguide_normal.md) intead.

## Prerequesits

- [Signal desktop app in which you're "logged in"](https://www.signal.org/download/)
- [Exported Whatsapp chat history (**not** the back up)](https://faq.whatsapp.com/android/chats/how-to-save-your-chat-history/?lang=en)

> Note that, if you choose to not export media, then whatsapp will replace the entire message with `<Media omitted>`.
> This script automatically filters those out, but this also means that text that was sent alongside some media will _not_ show up (as whatsapp doesn't export those).
> If you still want them, you can export with media and then remove the referenced files from the folder

## Step 1: Verify code

The code found in the [main.js](main.js) file in this repository will be executed in a context that allows it to control the UI of your Signal app.
Naturally, you shouldn't just execute a random script from the internet in that way.

Please have a look through the JavaScript code to ensure that it doesn't do anything malicious.
(It doesn't – but you know… you shouldn't trust a random internet stranger (me))

In order to allow you to do that, I decided to write my entire code directly in one .js file.
That way so you don't have to trust me that the built file is actually just the built file of whatever source I provide and that I didn't also add some malicious code in the build stage.
Sadly this also means that there is one large .js file.

## Step 2: Import the chat history

Trust my code? Good

First you need to have the exported chat files on your computer.
Feel free to edit the name of the "WhatsApp Chat ….txt" file and its contents as long as you keep to its format & don't rename the image files if you exported them – they are referenced by name).
Note, however, that this script requires the log to start with "WhatsApp Chat" and end with ".txt" – that's how it recognises the log file in the first place.

Then you copy the script from [main.js](main.js) and open the Signal Desktop app.
Make sure you have the chat selected in which you want to send the messages (the input field has to be visible).
For the script to work correctly, you need the input field in its "small" not-expanded form!
In there, now open the developer console (`Ctrl+Shift+I` or `View > Toggle Developer Tools`), paste the copied code into it and press enter.

There should now be an overlay in the Signal app.
In there, you can now upload the exported chat.
The file upload allows you to upload multiple files – make sure you get all of the relevant files and do **not** upload an archive.

Once you press "Start" it will automatically re-send your texts.
Please don't touch anything in the Signal app until the popup that tells you that it is done pops up.