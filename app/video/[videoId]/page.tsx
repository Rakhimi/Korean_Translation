import Video from "./Video"




const VideoPage = ({ params }: { params: { videoId: string } }) => {

    console.log(params.videoId)

    const id = params.videoId

    return(
        <div>
            <Video id={id}/>
        </div>
    );
};

export default VideoPage;