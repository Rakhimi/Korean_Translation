'use client'

import MaxWidthWrapper from '@/components/MaxWidthWrapper';
import Search from '@/components/Search';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/components/SearchContext';

const Homepage = () => {

  const router = useRouter();
  const { trackName, setTrackName, artistName, setArtistName} = useSearch();

  const handleSearch = () => {
    router.push(`/videoListing?trackName=${trackName}&artistName=${artistName}`);
  };


  return (
    <div>
      <MaxWidthWrapper>
        <Search
          handleSearch={handleSearch}
        />
      </MaxWidthWrapper>
    </div>
  );
};

export default Homepage;
