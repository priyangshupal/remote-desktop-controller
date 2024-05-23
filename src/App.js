import { useRef } from "react";
import "./App.css";

function App() {
  const videoRef = useRef();
  const getStream = async (screenId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: screenId,
          },
        },
      });
      handleStream(stream);
    } catch (error) {
      console.error(error);
    }
  };
  const handleStream = (stream) => {
    console.info("stream", stream);
    // let { width, height } = stream.getVideoTracks()[0].getSettings();
    // window.electronAPI.setSize({ width, height });
    videoRef.current.srcObject = stream;
    videoRef.current.onloadedmetadata = (e) => videoRef.current.play();
  };

  // Display the screen
  window.electronAPI.getScreenId((event, screenId) => {
    console.log("screenId from app.js:", screenId);
    getStream(screenId);
  });
  return (
    <div className='App'>
      <span>800 x 600</span>
      <video ref={videoRef} className='video'>
        video not available
      </video>
    </div>
  );
}

export default App;
