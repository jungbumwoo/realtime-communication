'use strict';

// video streaming
const mediaStreamConstraints = {
    video: true,
};

// Video element where stram will be placed
const localVideo = document.querySelector('video');

// Local stream that will be reproduced on the video
let localStream;

// Handles success by adding the MediaStream to the video element.
function getLocalMediaStream(mediaStream) {
    localStream = mediaStream;
    localVideo.srcObject = mediaStream;
}

// Handles error by logging a message to the console with the error message.
function handleLocalMediaStreamError(error) {
    console.log('navigator.getUserMedia error: ', error);
}

// Initializes media stream. 
navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
    .then(getLocalMediaStream).catch(handleLocalMediaStreamError);