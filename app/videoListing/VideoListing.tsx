'use client'

import React, { useState, useEffect } from 'react';
import { fetchVideos } from '@/utils/api';
import { useSearch } from '@/components/SearchContext';
import { useRouter } from 'next/navigation';
import MaxWidthWrapper from '@/components/MaxWidthWrapper';
import Search from '@/components/Search';

const VideoListing = () => {
  const [videos, setVideos] = useState<any[]>([]);
  const { trackName, setTrackName, artistName, setArtistName } = useSearch();
  const [isParamsLoaded, setIsParamsLoaded] = useState(false); // To ensure params are loaded before fetching videos
  const router = useRouter();

  // Retrieve search parameters from local storage on initial load
  useEffect(() => {
    const storedTrackName = localStorage.getItem('trackName');
    const storedArtistName = localStorage.getItem('artistName');

    if (storedTrackName) setTrackName(storedTrackName);
    if (storedArtistName) setArtistName(storedArtistName);

    setIsParamsLoaded(true); // Indicate that parameters have been loaded
  }, [setTrackName, setArtistName]);

  // Save search parameters to local storage when they change
  useEffect(() => {
    localStorage.setItem('trackName', trackName);
    localStorage.setItem('artistName', artistName);
  }, [trackName, artistName]);

  useEffect(() => {
    const fetchVideoResults = async () => {
      if (trackName && artistName) {
        const query = `${trackName} ${artistName}`;
        const results = await fetchVideos(query);
        setVideos(results);
      }
    };

    if (isParamsLoaded) {
      fetchVideoResults();
    }
  }, [router, trackName, artistName, isParamsLoaded]);

  const handleVideoSelect = async (video: any) => {
    const videoId = video.id.videoId;
    router.push(`/video/${videoId}?trackName=${encodeURIComponent(trackName)}&artistName=${encodeURIComponent(artistName)}`);
  };

  const handleSearch = (trackName: string, artistName: string) => {
    router.push(`/videoListing?trackName=${trackName}&artistName=${artistName}`);
  };

  return (
    <div>
      <MaxWidthWrapper>
        <Search handleSearch={handleSearch} />
        <div className='w-full flex justify-center mb-10'>
          <div>
            {videos.map((video) => (
              <div key={video.id.videoId}
                className='border-2 flex gap-4 rounded-md h-28 mb-2'
                onClick={() => handleVideoSelect(video)}>
                <img
                  src={video.snippet.thumbnails.default.url}
                  alt={video.snippet.title}
                  className='rounded-md'
                />
                <p className='font-bold'>{video.snippet.title}</p>
              </div>
            ))}
          </div>
        </div>
      </MaxWidthWrapper>
    </div>
  );
};

export default VideoListing;
