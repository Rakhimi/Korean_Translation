import path from 'path';
import axios from 'axios';
import fs from 'fs';
import { NextResponse } from 'next/server';
import { Translate } from '@google-cloud/translate/build/src/v2';
import { google } from 'googleapis';

interface LyricsLine {
    text: string;
}

interface TranslatedWord {
    original: string;
    translated: string;
}

interface TranslatedLyricsLine {
    text: string;
    translatedWords: TranslatedWord[];
    translatedText: string; // Added to store the translated line
}

const cheerio = require('cheerio');

// Initialize Google Cloud Translation client
const translate = new Translate({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'), // Ensure proper formatting of the key
    },
    projectId: 'heroic-muse-429713-u7',
});

// Initialize Google Drive API client
const drive = google.drive({
    version: 'v3',
    auth: new google.auth.JWT({
        email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
        key: process.env.GOOGLE_DRIVE_PRIVATE_KEY!.replace(/\\n/g, '\n'), // Replace escaped newlines with actual newlines
        scopes: ['https://www.googleapis.com/auth/drive.file'],
    }),
});

const parseLyrics = (lyricsContent: string): LyricsLine[] => {
    const lines = lyricsContent.split('\n').map(line => ({ text: line.trim() }));
    return lines.filter(line => line.text.length > 0);
};

// Function to determine if a word is English
const isEnglish = (word: string): boolean => /^[a-zA-Z]+$/.test(word);

// Function to translate lyrics line by line and word by word
const translateLyrics = async (lyrics: LyricsLine[]): Promise<TranslatedLyricsLine[]> => {
    const translatedLyrics: TranslatedLyricsLine[] = [];

    for (const line of lyrics) {
        const words = line.text.split(' ');
        const translatedWords: TranslatedWord[] = [];

        // Translate each word
        for (const word of words) {
            if (isEnglish(word)) {
                translatedWords.push({ original: word, translated: word });
            } else {
                try {
                    const [translation] = await translate.translate(word, { from: 'ko', to: 'en' });
                    translatedWords.push({ original: word, translated: translation });
                } catch (error) {
                    console.error(`Error translating word "${word}":`, error);
                    translatedWords.push({ original: word, translated: '[Translation Error]' });
                }
            }
        } 

        // Translate the whole line
        try {
            const [lineTranslation] = await translate.translate(line.text, { from: 'ko', to: 'en' });
            translatedLyrics.push({
                text: line.text,
                translatedWords,
                translatedText: lineTranslation, // Store the translated line
            });
        } catch (error) {
            console.error(`Error translating line "${line.text}":`, error);
            translatedLyrics.push({
                text: line.text,
                translatedText: '[Translation Error]', // Handle translation error for the line
                translatedWords,
            });
        }
    }

    return translatedLyrics;
};

// Function to upload file to Google Drive
const uploadToGoogleDrive = async (fileName: string, content: string) => {
    const fileMetadata = {
        name: fileName,
        parents: ['1uetHeh5mM-lLCQrsM5C1GBD8iDhREi-Z'], // Replace with your folder ID if needed
    };
    const media = {
        mimeType: 'application/json',
        body: content,
    };
    const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id',
    });
    return response.data.id;
};

// Function to check if file exists in Google Drive
const fileExistsInDrive = async (fileName: string) => {
    try {
        const existingFiles = await drive.files.list({
            q: `name='${fileName}' and trashed=false`,
            fields: 'files(id, name)',
        });

        const files = existingFiles.data.files || [];
        if (files.length > 0) {
            return files[0].id; // Return the ID of the first found file
        }
    } catch (error) {
        console.error('Error checking file existence:', error);
    }
    return null; 
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

// Function to extract lyrics from the Genius lyrics page
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




export async function POST(request: Request) {
    const body = await request.json();
    const { trackName, artistName, title } = body;

    try {

        

        const fileName = `${artistName}_${trackName}.json`.replace(
            /[^a-zA-Z0-9]/g,
            '_'
        );

        console.log('Checking if file exists in Google Drive:', fileName);

        if (title && title.toLowerCase().includes(trackName.toLowerCase()) && title.toLowerCase().includes(artistName.toLowerCase())) {
            const fileId = await fileExistsInDrive(fileName);
            if (fileId) {
                const file = await drive.files.get({
                    fileId: fileId,
                    alt: 'media',
                });

                return NextResponse.json(file.data);
            }
        }

        const lyrics = await fetchLyricsFromGenius(trackName, artistName);
        
        // Parse and translate lyrics
        const parsedLyrics = parseLyrics(lyrics); // Adjust if `lyrics` format differs
        const translatedLyrics = await translateLyrics(parsedLyrics);

        console.log(parsedLyrics)

        // Save translated lyrics to Google Drive
        const content = JSON.stringify(translatedLyrics);
        const newFileId = await uploadToGoogleDrive(fileName, content);

        return NextResponse.json(translatedLyrics);
    } catch (error: any) {
        console.error('Error processing request:', error.response ? error.response.data : error.message);
        return NextResponse.error();
    }
}

