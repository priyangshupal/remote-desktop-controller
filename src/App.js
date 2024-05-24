import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import "./App.css";

const socket = io("http://localhost:4000/remote-ctrl");

function App() {
  const videoRef = useRef();
  const rtcPeerConnection = useRef(
    new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    })
  );
  const getUserMedia = async (constraints) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      rtcPeerConnection.current
        .createOffer({
          offerToReceiveVideo: 1,
        })
        .then((sdp) => {
          rtcPeerConnection.current.setLocalDescription(sdp);
          console.log("sending offer");
          socket.emit("offer", sdp);
        });
    } catch (e) {
      console.log(e);
    }
  };
  useEffect(() => {
    const getStream = async (selectedScreen) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: "desktop",
              chromeMediaSourceId: selectedScreen.id,
            },
          },
        });
        handleStream(selectedScreen, stream);
      } catch (error) {
        console.error(error);
      }
    };
    // Display the screen
    (window.electronAPI &&
      window.electronAPI.getScreenId((event, screenId) => {
        console.log("screenId from app.js:", screenId);
        getStream(screenId);
      })) ||
      getUserMedia({ video: true, audio: false });
    socket.on("offer", (offerSDP) => {
      console.log("received offer");
      rtcPeerConnection.current
        .setRemoteDescription(new RTCSessionDescription(offerSDP))
        .then(() => {
          rtcPeerConnection.current.createAnswer().then((sdp) => {
            rtcPeerConnection.current.setLocalDescription(sdp);

            console.log("sending answer");
            socket.emit("answer", sdp);
          });
        });
    });

    socket.on("answer", (answerSDP) => {
      console.log("received answer");
      rtcPeerConnection.current.setRemoteDescription(
        new RTCSessionDescription(answerSDP)
      );
    });

    socket.on("icecandidate", (icecandidate) => {
      rtcPeerConnection.current.addIceCandidate(
        new RTCIceCandidate(icecandidate)
      );
    });

    socket.on("selectedScreen", (selectedScreen) => {
      setSelectedScreen(selectedScreen);
    });

    rtcPeerConnection.current.onicecandidate = (e) => {
      if (e.candidate) socket.emit("icecandidate", e.candidate);
    };

    rtcPeerConnection.current.oniceconnectionstatechange = (e) => {
      console.log(e);
    };

    rtcPeerConnection.current.ontrack = (e) => {
      videoRef.current.srcObject = e.streams[0];
      videoRef.current.onloadedmetadata = (e) => videoRef.current.play();
    };
  }, []);

  const [selectedScreen, _setSelectedScreen] = useState(1);
  const selectedScreenRef = useRef(selectedScreen);
  const setSelectedScreen = (newSelectedScreen) => {
    selectedScreenRef.current = newSelectedScreen;
    _setSelectedScreen(newSelectedScreen);
  };

  const handleStream = (selectedScreen, stream) => {
    setSelectedScreen(selectedScreen);
    console.log("emitting selectedScreen", selectedScreen);
    socket.emit("selectedScreen", selectedScreen);
    // let { width, height } = stream.getVideoTracks()[0].getSettings();
    // window.electronAPI.setSize({ width, height });
    // videoRef.current.srcObject = stream;
    rtcPeerConnection.current.addStream(stream);
    // videoRef.current.onloadedmetadata = (e) => videoRef.current.play();
  };

  const handleMouseClick = (e) => socket.emit("mouse_click", {});
  const handleMouseMove = ({ clientX, clientY }) =>
    socket.emit("mouse_move", {
      clientX,
      clientY,
      clientWidth: window.innerWidth,
      clientHeight: window.innerHeight,
    });

  return (
    <div className='App'>
      <div
        style={{ display: "block", backgroundColor: "black", margin: 0 }}
        onMouseMove={handleMouseMove}
        onClick={handleMouseClick}
      >
        <video ref={videoRef} className='video'>
          video not available
        </video>
      </div>
    </div>
  );
}

export default App;
