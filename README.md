# Whatsapp to Signal chat transfer

## What is it?

Since there is currently a big shift to switch from Whatsapp to [Signal](https://www.signal.org/), I wrote this script to help import messages.

It does this by reading the whatsapp log (that you provide – see the tutorial below) and automatically sending the same messages over signal.

> _Note: I'm in no way affiliated with Signal – most likely they don't even know about this script._

> _Another note: The script will send all of your texts again over Signal. This will use your data/SMS/MMS just the same as if you 'd send them manually over Signal._

## Some assumptions the script has to make

Since whatsapp's chat log does not have a format that is always perfectly mappable to the original chat, a few assumptions were made in order to parse it:

- Nobody sent a message with the only content being `<media omitted>`
    - This message is how whatsapp marks messages where media was originally sent, but was not exported
    - Otherwise that message will be ignored
- Nobody sent a message that ends in `(file attached)` and before it features a text matching the regex `\S+\.(\S+)? `
    - This is how sent images/videos/other files look like in the log
    - The script will try to import a media with the name equal to the text before `(file attached)`
- Nobody has a name that includes a `:`
    - Since all messages of whatsapp are exported as `<name of the person who sent the message>: <message>`, the part after the `:` in the name of a person will have to be interpreted as the separator between the name and the message
    - All messages of that person will be prefixed with the part of his name after the `:` and an additional `: `
- None of the notifications that whatsapp sent include `:`
    - Again, this is the only way that whatsapp's logs mark messages (that I found)
    - AFAIK this should only happen if the name of the group ever included `:`
    - The easiest way to stop that is by going into the text file and removing the `:` in the notification(s)

## How to use it

I wrote two user guides, depending on your level of technical knowledge:

- [Guide for the Pros (You know how to read JavaScript and how to use the developer console in chrome)](userguide_pros.md)
- [Guide for the normal users](userguide_normal.md)

## Roadmap

- [x] Handle pure text messages
- [x] Handle files that were sent
- [ ] Allow for different configurations
    - [ ] Including the timestamp using different formats
    - [ ] Including the sender as a prefix to the text
    - [ ] Include notifications (e.g. "X created group …", "X added Y")
    - [ ] Skip media files that aren't available without alarm
- [ ] Allow for synchronisation between multiple people in order to simulate senders