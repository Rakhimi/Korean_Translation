import Video from "./Video"




const VideoPage = ({ params }: { params: { videoId: string } }) => {

    

    const id = params.videoId
    console.log(id)

    return(
        <div>
            <Video id={id}/>
        </div>
    );
};

export default VideoPage;