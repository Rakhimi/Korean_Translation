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

// Function to translate lyrics line by line and word by word
const BATCH_SIZE = 100; // Adjust the batch size based on your needs and API limits

const translateLyrics = async (lyrics: LyricsLine[]): Promise<TranslatedLyricsLine[]> => {
    const translatedLyrics: TranslatedLyricsLine[] = [];

    for (const line of lyrics) {
        const words = line.text.split(' ');
        const translatedWords: TranslatedWord[] = [];

        // Function to batch translate words
        const batchTranslate = async (batch: string[]) => {
            try {
                const [translations] = await translate.translate(batch, { from: 'ko', to: 'en' });
                return translations;
            } catch (error) {
                console.error('Error translating batch:', error);
                return batch.map(word => '[Translation Error]'); // Return error placeholder for each word
            }
        };

        // Translate each batch of words
        for (let i = 0; i < words.length; i += BATCH_SIZE) {
            const batch = words.slice(i, i + BATCH_SIZE);
            const translations = await batchTranslate(batch);

            // Map translations back to the original words
            batch.forEach((word, index) => {
                translatedWords.push({
                    original: word,
                    translated: translations[index] || '[Translation Error]',
                });
            });
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




export async function POST(request: Request) {
    const body = await request.json();
    const { parsedLyrics, fileName } = body;

    try {

        const translatedLyrics = await translateLyrics(parsedLyrics);

        // Save translated lyrics to Google Drive
        const content = JSON.stringify(translatedLyrics);
        const newFileId = await uploadToGoogleDrive(fileName, content);

        return NextResponse.json(translatedLyrics);
    } catch (error: any) {
        console.error('Error processing request:', error.response ? error.response.data : error.message);
        return NextResponse.error();
    }
}

