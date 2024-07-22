'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SearchContextProps {
  trackName: string;
  setTrackName: React.Dispatch<React.SetStateAction<string>>;
  artistName: string;
  setArtistName: React.Dispatch<React.SetStateAction<string>>;
}

const SearchContext = createContext<SearchContextProps | undefined>(undefined);

export const SearchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [trackName, setTrackName] = useState<string>('');
  const [artistName, setArtistName] = useState<string>('');

  return (
    <SearchContext.Provider value={{ trackName, setTrackName, artistName, setArtistName}}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = (): SearchContextProps => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
