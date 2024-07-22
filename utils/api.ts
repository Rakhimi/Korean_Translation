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

  const title = video.snippet.title;

  return { title };
};


  
  

