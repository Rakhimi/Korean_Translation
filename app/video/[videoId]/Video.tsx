'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearch } from '@/components/SearchContext';
import { fetchVideoDetails } from '@/utils/api';
import { fetchMusicBrainzDetails } from '@/utils/musicbrainz';
import VideoPlayer from '@/components/VideoPlayer';
import Lyrics from '@/components/Lyrics';
import MaxWidthWrapper from '@/components/MaxWidthWrapper';
import Search from '@/components/Search';
import { useRouter, useSearchParams } from 'next/navigation';
import { Circles } from 'react-loader-spinner';

interface VideoProps {
  id: string;
}

const Video: React.FC<VideoProps> = ({ id }) => {
  const [translatedLyrics, setTranslatedLyrics] = useState([]);
  const [loading, setLoading] = useState(false);
  const { trackName, setTrackName, artistName, setArtistName, albumName, setAlbumName } = useSearch();
  const [lyricsAvailable, setLyricsAvailable] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Retrieve search parameters from local storage on initial load
  useEffect(() => {
    const storedTrackName = localStorage.getItem('trackName');
    const storedArtistName = localStorage.getItem('artistName');
    const storedAlbumName = localStorage.getItem('albumName');

    if (storedTrackName) setTrackName(storedTrackName);
    if (storedArtistName) setArtistName(storedArtistName);
    if (storedAlbumName) setAlbumName(storedAlbumName);
  }, [setTrackName, setArtistName, setAlbumName]);

  // Save search parameters to local storage when they change
  useEffect(() => {
    localStorage.setItem('trackName', trackName);
    localStorage.setItem('artistName', artistName);
    localStorage.setItem('albumName', albumName);
  }, [trackName, artistName, albumName]);

  useEffect(() => {
    const fetchVideoAndLyrics = async () => {
      if (!id || !trackName || !artistName) return;

      setLoading(true); // Set loading to true before starting the request

      try {
        const { duration, title } = await fetchVideoDetails(id as string);
        console.log(duration);

        let finalAlbumName = albumName;

        // If albumName is not provided, fetch from MusicBrainz
        if (!albumName) {
          const musicBrainzDetails = await fetchMusicBrainzDetails(trackName, artistName);
          finalAlbumName = musicBrainzDetails?.albumName || 'Unknown Album';
        }

        const response = await axios.post('/api/lyrics', {
          trackName,
          artistName,
          albumName: finalAlbumName,
          duration,
          title,
        });

        setTranslatedLyrics(response.data);
        setLyricsAvailable(true);
      } catch (error) {
        setLyricsAvailable(false);
        console.error('Error fetching video and lyrics:', error);
      } finally {
        setLoading(false); // Set loading to false after the request is finished
      }
    };

    fetchVideoAndLyrics();
  }, [id, trackName, artistName, albumName]);

  const handleSearch = (trackName: string, artistName: string, albumName: string) => {
    router.push(`/videoListing?trackName=${trackName}&artistName=${artistName}&albumName=${albumName}`);
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
                <p className='font-bold text-lg'>No lyrics available for this video, try entering the album name and clicking again or clicking on a different video</p>
              )}
            </div>
          </div>
        )}
      </div>
    </MaxWidthWrapper>
  );
};

export default Video;
