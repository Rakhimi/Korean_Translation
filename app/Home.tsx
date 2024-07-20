'use client'

import MaxWidthWrapper from '@/components/MaxWidthWrapper';
import Search from '@/components/Search';
import { useRouter } from 'next/navigation';

const Homepage = () => {

  const router = useRouter();

  const handleSearch = (trackName:string, artistName:string, albumName:string) => {
    router.push(`/videoListing?trackName=${trackName}&artistName=${artistName}&albumName=${albumName}`);
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
