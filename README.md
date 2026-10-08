# LBI Arcade preview

Password-protected preview build, served with GitHub Pages. Every file under `e/` is AES-GCM encrypted;
the start page asks for the password, derives the key in the browser (PBKDF2), and a service worker
decrypts the game on the fly. Without the password, nothing here is readable.

Source lives in a private repo. This repo is regenerated from it, so don't edit files here by hand.
