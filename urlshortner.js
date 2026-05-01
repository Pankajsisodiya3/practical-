// npm i express mongoose nanoid valid-url

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const { nanoid } = require('nanoid'); // ✅ fixed
const validUrl = require('valid-url');
const port = 8080;

// middleware
app.use(express.json());

// connection
mongoose.connect('mongodb://localhost:27017/url-short')
.then(() => {
    console.log('mongodb connected successfully');
})
.catch((err) => {   // ✅ fixed
    console.error(err); // ✅ fixed
});

// schema
const urlSchema = new mongoose.Schema({
    full: {
        type: String,
        required: true
    },
    short: {
        type: String,
        required: true,
        unique: true
    },
    clicks: {
        type: Number,
        default: 0
    }
});

const Url = mongoose.model('Url', urlSchema);

// create short URL
async function createShortUrl(originalUrl) {
    if (!validUrl.isUri(originalUrl)) {
        throw new Error("Invalid URL");
    }

    const shortId = nanoid(6);

    const newUrl = new Url({
        full: originalUrl,
        short: shortId
    });

    await newUrl.save();

    return `http://localhost:${port}/${shortId}`;
}

// shorten API
app.post('/shorten', async (req, res) => {
    try {
        const { url } = req.body;

        const shortUrl = await createShortUrl(url);

        res.json({ shortUrl });

    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// redirect API
app.get('/:short', async (req, res) => {
    try {
        const url = await Url.findOne({ short: req.params.short });

        if (!url) {
            return res.status(404).send("URL not found");
        }

        url.clicks++;
        await url.save();

        res.redirect(url.full);

    } catch (err) {
        res.status(500).send("Server error");
    }
});

// server start
app.listen(port, () => {
    console.log(`server is up on port ${port}`);
});