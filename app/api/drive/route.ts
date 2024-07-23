


import { google } from 'googleapis';
import { NextResponse } from 'next/server';


const drive = google.drive({
    version: 'v3',
    auth: new google.auth.JWT({
        email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
        key: process.env.GOOGLE_DRIVE_PRIVATE_KEY!.replace(/\\n/g, '\n'), // Replace escaped newlines with actual newlines
        scopes: ['https://www.googleapis.com/auth/drive.file'],
    }),
});

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
    const { fileName } = body;
  
    try {
      const fileId = await fileExistsInDrive(fileName);
      if (fileId) {
        const file = await drive.files.get({
          fileId: fileId,
          alt: 'media',
        });
  
        return NextResponse.json({
          exists: true,
          fileContent: file.data,
        });
      }
  
      return NextResponse.json({ exists: false });
    } catch (error) {
      console.error('Error checking file existence or retrieving file:', error);
      return NextResponse.json({ error: 'Error checking file existence or retrieving file' }, { status: 500 });
    }
  }