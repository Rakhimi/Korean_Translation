'use client';

import React, { useRef, useState } from 'react';
import { useSearch } from './SearchContext';
import { Input } from "@/components/ui/input";
import { Button } from './ui/button';

interface SearchProps {
  handleSearch: (trackName:string, artistName:string, albumName:string) => void;
}

const Search: React.FC<SearchProps> = ({ handleSearch }) => {
  const { trackName, setTrackName, artistName, setArtistName, albumName, setAlbumName } = useSearch();

  const [errors, setErrors] = useState<{ trackName?: string; artistName?: string }>({});

  const trackNameRef = useRef<HTMLInputElement>(null);
  const artistNameRef = useRef<HTMLInputElement>(null);
  const albumNameRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    setErrors({});

    const newTrackName = trackNameRef.current?.value;
    const newArtistName = artistNameRef.current?.value;
    const newAlbumName = albumNameRef.current?.value;

    let hasErrors = false;
    if (!newTrackName) {
      setErrors((prev) => ({ ...prev, trackName: 'Track name is required.' }));
      hasErrors = true;
    }
    if (!newArtistName) {
      setErrors((prev) => ({ ...prev, artistName: 'Artist name is required.' }));
      hasErrors = true;
    }

    if (!hasErrors) {
      setTrackName(newTrackName!);
      setArtistName(newArtistName!);
      setAlbumName(newAlbumName || '');
      handleSearch(newTrackName!,newArtistName!,albumName!);
    }
  };

  return (
    <div className='mb-5'>
      <form onSubmit={handleSubmit} className="mt-10 flex flex-col md:flex-row justify-center items-center md:items-start gap-2 md:ml-20">
        <div className='flex flex-col justify-center items-center w-full 
        md:w-1/2'>
        <div className="flex flex-col md:flex-row justify-center items-center md:items-start gap-2 w-full">
          <div className="w-full">
            <Input
              type="text"
              placeholder="Enter Track Name"
              className={`bg-sky-200 rounded-md hover:border-sky-400 p-1 ${errors.trackName ? 'border-red-500' : ''}`}
              ref={trackNameRef}
              defaultValue={trackName}
            />
            {errors.trackName && (
              <p className="text-red-500 text-sm mt-1">{errors.trackName}</p>
            )}
          </div>
          <div className="w-full">
            <Input
              type="text"
              placeholder="Enter Artist Name"
              className={`bg-sky-200 rounded-md hover:border-sky-400 p-1 ${errors.artistName ? 'border-red-500' : ''}`}
              ref={artistNameRef}
              defaultValue={artistName}
            />
            {errors.artistName && (
              <p className="text-red-500 text-sm mt-1">{errors.artistName}</p>
            )}
          </div>
        </div>
        <div className="mt-2 w-full md:w-1/2">
            <Input
              type="text"
              placeholder="Enter Album Name"
              className='bg-sky-200 rounded-md hover:border-sky-400 p-1 w-full'
              ref={albumNameRef}
              defaultValue={albumName}
            />
        </div>
        </div>
          <Button 
            type="submit"
            className='bg-sky-500 hover:bg-sky-700 w-1/2 md:w-auto font-bold rounded-md px-2 py-1'
          >
            Search
          </Button>
      </form>
    </div>
  );
};

export default Search;
