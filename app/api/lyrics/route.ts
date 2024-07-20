import path from 'path';
import axios from 'axios';
import fs from 'fs';
import { NextResponse } from 'next/server';
import { Translate } from '@google-cloud/translate/build/src/v2';
import { google } from 'googleapis';

interface LyricsLine {
    timestamp: string;
    text: string;
}

interface TranslatedWord {
    original: string;
    translated: string;
}

interface TranslatedLyricsLine {
    timestamp: string;
    text: string;
    translatedWords: TranslatedWord[];
    translatedText: string; // Added to store the translated line
}



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

const parseLRC = (lrcContent: string): LyricsLine[] => {
    const lines = lrcContent.split('\n');
    const lyrics: LyricsLine[] = [];
    const timeRegex = /\[(\d{2}:\d{2}\.\d{2})\]/;

    lines.forEach((line) => {
        const match = line.match(timeRegex);
        if (match) {
            const timestamp = match[1];
            const text = line.replace(timeRegex, '').trim();
            lyrics.push({ timestamp, text });
        }
    });

    return lyrics;
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
                timestamp: line.timestamp,
                text: line.text,
                translatedWords,
                translatedText: lineTranslation, // Store the translated line
            });
        } catch (error) {
            console.error(`Error translating line "${line.text}":`, error);
            translatedLyrics.push({
                timestamp: line.timestamp,
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

export async function POST(request: Request) {
    const body = await request.json();
    const { trackName, artistName, albumName, duration, title } = body;

    try {

        
        const params = {
            track_name: trackName,
            artist_name: artistName,
            album_name: albumName,
            duration: duration.toString(),
        };

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

        console.log('Fetching lyrics with params:', params);

        const response = await axios.get('https://lrclib.net/api/get', {
            params,
        });

        console.log('Lyrics response:', response.data);

        if (response.data && (response.data.plainLyrics || response.data.syncedLyrics)) {
            // Parse and translate lyrics
            const parsedLyrics = parseLRC(response.data.syncedLyrics);
            const translatedLyrics = await translateLyrics(parsedLyrics);

            // Save translated lyrics to Google Drive
            const content = JSON.stringify(translatedLyrics);
            const newFileId = await uploadToGoogleDrive(fileName, content);

            return NextResponse.json(translatedLyrics);
        } else {
            throw new Error('No lyrics found');
        }
    } catch (error: any) {
        console.error('Error processing request:', error.response ? error.response.data : error.message);
        return NextResponse.error();
    }
}
