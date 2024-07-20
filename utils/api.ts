import axios from 'axios';




const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
// Fetch videos based on the query
export const fetchVideos = async (query: string) => {
  const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
    params: {
      part: 'snippet',
      q: query,
      type: 'video',
      key: apiKey,
    }
  });
  return response.data.items;
};

// Parse ISO 8601 duration to seconds
export const parseISO8601Duration = (duration: string): number => {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = duration.match(regex);
  if (!matches) {
    return 0; // Return 0 if the duration does not match the expected pattern
  }
  const hours = parseInt(matches[1] || '0', 10);
  const minutes = parseInt(matches[2] || '0', 10);
  const seconds = parseInt(matches[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
};

// Fetch video details based on videoId
export const fetchVideoDetails = async (videoId: string) => {
  const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
    params: {
      part: 'snippet,contentDetails',
      id: videoId,
      key: apiKey,
    }
  });
  const video = response.data.items[0];

  const duration = parseISO8601Duration(video.contentDetails.duration);
  const title = video.snippet.title;

  return { duration, title };
};


  
  

