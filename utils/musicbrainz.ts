import axios from 'axios';

const MUSICBRAINZ_API_URL = 'https://musicbrainz.org/ws/2';

export const fetchMusicBrainzDetails = async (trackName: string, artistName: string) => {
  try {
    const response = await axios.get(`${MUSICBRAINZ_API_URL}/recording`, {
        params: {
        query: `recording:${trackName} AND artist:${artistName}`,
          fmt: 'json'
        }
      });

    if (!response.data.recordings || response.data.recordings.length === 0) {
    throw new Error('No recording found');
    }

    const recording = response.data.recordings[0];

    const album = recording.releases[0]?.title || 'Unknown Album';
    

    return {
      trackName,
      artistName,
      albumName: album,
      
    };
  } catch (error) {
    console.error('Error fetching MusicBrainz details:', error);
    return null;
  }
};