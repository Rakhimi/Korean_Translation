import axios from 'axios';
import { NextResponse } from 'next/server';
const cheerio = require('cheerio');


const extractLyricsFromPage = (html: string): string => {
    const $ = cheerio.load(html);

    // Select the lyrics container using the data-lyrics-container attribute
    const lyricsElement = $('div[data-lyrics-container="true"]');

    if (lyricsElement.length > 0) {
        // Extract and clean up the text from the lyrics element
        const lyrics = lyricsElement
            .find('br')
            .replaceWith('\n') // Replace <br> tags with newline characters
            .end()
            .text()
            .trim();

        // Optional: Remove extra spaces and unwanted characters
        const cleanedLyrics = lyrics.replace(/\s{2,}/g, ' ').replace(/(\s*\n\s*)+/g, '\n');

        return cleanedLyrics;
    } else {
        console.log('Lyrics not found');
        return '';
    }
};

const fetchLyricsFromGenius = async (trackName: string, artistName: string) => {
    const GENIUS_API_URL = 'https://api.genius.com';
    const GENIUS_ACCESS_TOKEN = process.env.GENIUS_ACCESS_TOKEN;

    // Search for the song
    const searchResponse = await axios.get(`${GENIUS_API_URL}/search`, {
        params: { q: `${trackName} ${artistName}` },
        headers: { Authorization: `Bearer ${GENIUS_ACCESS_TOKEN}` }
    });

    const songId = searchResponse.data.response.hits[0]?.result?.id;

    if (!songId) {
        throw new Error('Song not found');
    }

    // Fetch song details
    const songResponse = await axios.get(`${GENIUS_API_URL}/songs/${songId}`, {
        headers: { Authorization: `Bearer ${GENIUS_ACCESS_TOKEN}` }
    });

    const lyricsPath = songResponse.data.response.song.path;

    // Fetch lyrics using the song path
    const lyricsPage = await axios.get(`https://genius.com${lyricsPath}`);

    const lyrics = extractLyricsFromPage(lyricsPage.data); // You need to implement this function

    return lyrics;
};

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { trackName, artistName } = body;

        if (!trackName || !artistName) {
            return NextResponse.json({ error: 'trackName and artistName are required' }, { status: 400 });
        }

        // Fetch lyrics from Genius
        const lyrics = await fetchLyricsFromGenius(trackName, artistName);

        return NextResponse.json(lyrics);
    } catch (error) {
        console.error('Error fetching lyrics:', error);
        return NextResponse.json({ error: 'Failed to fetch lyrics' }, { status: 500 });
    }
}
