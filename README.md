# Whatsapp to Signal chat transfer

## What is it?

Since there is currently a big shift to switch from Whatsapp to [Signal](https://www.signal.org/), I wrote this script to help import messages.

It does this by reading the whatsapp log (that you provide – see the tutorial below) and automatically sending the same messages over signal.

> _Note: I'm in no way affiliated with Signal – most likely they don't even know about this script._

> _Another note: The script will send all of your texts again over Signal. This will use your data/SMS/MMS just the same as if you 'd send them manually over Signal._

## How to use it

I wrote two user guides, depending on your level of technical knowledge:

- [Guide for the Pros (You know how to read JavaScript and how to use the developer console in chrome)](userguide_pros.md)
- [Guide for the normal users](userguide_normal.md)

## Roadmap

- [x] Handle pure text messages
- [ ] Handle files that were sent
- [ ] Allow for different configurations
    - [ ] Including the timestamp using different formats
    - [ ] Including the sender as a prefix to the text
    - [ ] Include notifications (e.g. "X created group …", "X added Y")
    - [ ] Skip media files that aren't available without alarm
- [ ] Allow for synchronisation between multiple people in order to simulate senders