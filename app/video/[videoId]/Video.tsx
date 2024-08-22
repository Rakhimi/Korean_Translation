'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSearch } from '@/components/SearchContext';
import { fetchVideoDetails } from '@/utils/api';
import VideoPlayer from '@/components/VideoPlayer';
import Lyrics from '@/components/Lyrics';
import MaxWidthWrapper from '@/components/MaxWidthWrapper';
import Search from '@/components/Search';
import { useRouter } from 'next/navigation';
import { Circles } from 'react-loader-spinner';

interface VideoProps {
  id: string;
}

const Video: React.FC<VideoProps> = ({ id }) => {
  const [translatedLyrics, setTranslatedLyrics] = useState([]);
  const [loading, setLoading] = useState(false);
  const { trackName, setTrackName, artistName, setArtistName } = useSearch();
  const [lyricsAvailable, setLyricsAvailable] = useState(false);
  const router = useRouter();
  const initialLoad = useRef(true);
  const hasFetched = useRef(false); // Add a ref to prevent multiple fetches

  console.log(id)

  // Effect to load from local storage on initial load
  useEffect(() => {
    if (initialLoad.current) {
      console.log('Initial load - retrieving from local storage');
      const storedTrackName = localStorage.getItem('trackName');
      const storedArtistName = localStorage.getItem('artistName');

      if (storedTrackName) setTrackName(storedTrackName);
      if (storedArtistName) setArtistName(storedArtistName);

      initialLoad.current = false;
    }
  }, [setTrackName, setArtistName]);

  useEffect(() => {
    localStorage.setItem('trackName', trackName);
    localStorage.setItem('artistName', artistName);
  }, [trackName, artistName]);

  useEffect(() => {
    const fetchVideoAndLyrics = async () => {
      if (!id || !trackName || !artistName || hasFetched.current) return;
  
      setLoading(true);
  
      try {
        const { title } = await fetchVideoDetails(id as string);
  
        const fileName = `${artistName}_${trackName}.json`.replace(
          /[^a-zA-Z0-9]/g,
          '_'
        );
  
        console.log('Checking if file exists in Google Drive:', fileName);
  
        // Check if the file exists in Google Drive
        const driveResponse = await axios.post('/api/drive', {
          trackName,
          artistName,
          title,
          fileName
        });
  
        if (driveResponse.data.exists) {
          setTranslatedLyrics(driveResponse.data.fileContent);
          setLyricsAvailable(true);
        } else {
          setLyricsAvailable(false);
          console.log('File does not exist in Google Drive.');
        }
        
        hasFetched.current = true;
  
      } catch (error) {
        setLyricsAvailable(false);
        console.error('Error fetching video and lyrics:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchVideoAndLyrics();
  }, [id, trackName, artistName]);
  
  
  
  

  const handleSearch = (trackName: string, artistName: string) => {
    console.log('Handle search - navigating to video listing');
    router.push(`/videoListing?trackName=${trackName}&artistName=${artistName}`);
  };

  return (
    <MaxWidthWrapper>
      <Search handleSearch={handleSearch} />
      <div className='w-full flex justify-center mb-10 px-2'>
        {loading ? (
          <div className="flex flex-col gap-4 justify-center items-center">
            <Circles
              height="80"
              width="80"
              color="#38bdf8"
              ariaLabel="circles-loading"
              visible={true}
            />
            <h1 className='font-bold text-center'>Fetching and translating the lyrics...</h1>
          </div>
        ) : (
          <div className='w-full sm:w-1/2 flex flex-col gap-4'>
            <div className=''>
              {id && <VideoPlayer videoId={id as string} />}
            </div>
            <div className=''>
              {lyricsAvailable ? (
                <Lyrics translatedLyrics={translatedLyrics} />
              ) : (
                <p className='font-bold text-lg'>No lyrics available for this video</p>
              )}
            </div>
          </div>
        )}
      </div>
    </MaxWidthWrapper>
  );
};

export default Video;
