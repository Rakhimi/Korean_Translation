'use client';

import React, { useState, useEffect } from 'react';
import YouTube from 'react-youtube';

type VideoPlayerProps = {
  videoId: string;
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId }) => {
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getVideoDimensions = (width: number) => {
    if (width < 640) {
      return { height: 210, width: 360 };
    } else {
      return { height: 390, width: 640 };
    }
  };

  const { height, width } = getVideoDimensions(windowWidth);

  const opts = {
    height: height.toString(),
    width: width.toString(),
    playerVars: {
      // https://developers.google.com/youtube/player_parameters
      autoplay: 1,
    },
  };

  return (
    <div className="video-player flex justify-center">
      <div className="w-full">
        <YouTube videoId={videoId} opts={opts} className="w-full" />
      </div>
    </div>
  );
};

export default VideoPlayer;