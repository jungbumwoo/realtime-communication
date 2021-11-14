'use strict';

var localConnection;
var remoteConnection;
var sendChannel;
var receiveChannel;
var pcConstraint;
var dataConstraint;
var dataChannelSend = document.querySelector('textarea#dataChannelSend');
var dataChannelReceive = document.querySelector('textarea#dataChannelReceive');
var startButton = document.querySelector('button#startButton');
var sendButton = document.querySelector('button#sendButton');
var closeButton = document.querySelector('button#closeButton');

startButton.onclick = createConnection;
sendButton.onclick = sendData;
closeButton.onclick = closeDataChannels;

function enableStartButton() {
  startButton.disabled = false;
}

function disableSendButton() {
  sendButton.disabled = true;
}

function createConnection() {

  // 1. connection start

  console.log('startButton clicked');
  dataChannelSend.placeholder = '';
  var servers = null;
  pcConstraint = null;
  dataConstraint = null;
  trace('Using SCTP based data channels');
  console.log('.')

  // For SCTP, reliable and ordered delivery is true by default.
  // Add localConnection to global scope to make it visible
  // from the browser console.
  window.localConnection = localConnection =
      new RTCPeerConnection(servers, pcConstraint);
  console.log(`localConnection`, localConnection);
  trace('Created local peer connection object localConnection');
  console.log('.')

  sendChannel = localConnection.createDataChannel('sendDataChannel',
      dataConstraint);
  console.log(`sendChannel`, sendChannel);
  trace('Created send data channel');
  console.log('.')

  localConnection.onicecandidate = iceCallback1; // ** 3. 여기 실행됨 onAddIceCandidateSuccess !!
  sendChannel.onopen = onSendChannelStateChange;  // 4. Send channel state is: open
  sendChannel.onclose = onSendChannelStateChange;

  // Add remoteConnection to global scope to make it visible
  // from the browser console.
  window.remoteConnection = remoteConnection =
      new RTCPeerConnection(servers, pcConstraint);
  trace('Created remote peer connection object remoteConnection');
  console.log('.')


  /*   ****************  여기까지는 한 번에 찍히는 것 같아. ******************* */

  remoteConnection.onicecandidate = iceCallback2;  // ** 3. 여기 실행됨 onAddIceCandidateSuccess !!
  remoteConnection.ondatachannel = receiveChannelCallback;  // 4. Receive channel state is: open

  // * 2. offer를 하고 나면 gotDescription1, gotDescription2 실행.
  localConnection.createOffer().then(
    gotDescription1,   
    onCreateSessionDescriptionError
  );
  startButton.disabled = true;
  closeButton.disabled = false;

}

function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
  console.log('.')
}

function sendData() {
  console.log('sendBtn Clicked');
  var data = dataChannelSend.value;
  sendChannel.send(data);
  trace('Sent Data: ' + data); // ㄱ.  send
  console.log('.')
}

function closeDataChannels() { // a. closeBtn clicked
  console.log('Close Btn Clicked')
  trace('Closing data channels');
  console.log('.')
  sendChannel.close();
  trace('Closed data channel with label: ' + sendChannel.label);
  console.log('.')
  receiveChannel.close();
  trace('Closed data channel with label: ' + receiveChannel.label);
  console.log('.')
  localConnection.close();
  remoteConnection.close();
  localConnection = null;
  remoteConnection = null;
  trace('Closed peer connections');
  console.log('.')
  startButton.disabled = false;
  sendButton.disabled = true;
  closeButton.disabled = true;
  dataChannelSend.value = '';
  dataChannelReceive.value = '';
  dataChannelSend.disabled = true;
  disableSendButton();
  enableStartButton();
}

function gotDescription1(desc) {
  localConnection.setLocalDescription(desc);
  trace('Offer from localConnection \n' + desc.sdp);
  console.log('.')
  remoteConnection.setRemoteDescription(desc);
  remoteConnection.createAnswer().then(
    gotDescription2,
    onCreateSessionDescriptionError
  );
}

function gotDescription2(desc) {
  remoteConnection.setLocalDescription(desc);
  trace('Answer from remoteConnection \n' + desc.sdp);
  console.log('.')
  localConnection.setRemoteDescription(desc);
}

function iceCallback1(event) {
  trace('local ice callback');
  console.log('.')
  if (event.candidate) {
    remoteConnection.addIceCandidate(
      event.candidate
    ).then(
      onAddIceCandidateSuccess,
      onAddIceCandidateError
    );
    trace('Local ICE candidate: \n' + event.candidate.candidate);
    console.log('.')
  }
}

function iceCallback2(event) {
  trace('remote ice callback');
  console.log('.')
  if (event.candidate) {
    localConnection.addIceCandidate(
      event.candidate
    ).then(
      onAddIceCandidateSuccess,
      onAddIceCandidateError
    );
    trace('Remote ICE candidate: \n ' + event.candidate.candidate);
    console.log('.')
  }
}

function onAddIceCandidateSuccess() {
  trace('AddIceCandidate success.');
  console.log('.')
}

function onAddIceCandidateError(error) {
  trace('Failed to add Ice Candidate: ' + error.toString());
  console.log('.')
}

function receiveChannelCallback(event) {
  trace('Receive Channel Callback');
  console.log('.')
  receiveChannel = event.channel;
  receiveChannel.onmessage = onReceiveMessageCallback;
  receiveChannel.onopen = onReceiveChannelStateChange;
  receiveChannel.onclose = onReceiveChannelStateChange;
}

function onReceiveMessageCallback(event) {
  trace('Received Message');
  console.log('.')
  dataChannelReceive.value = event.data;
}

function onSendChannelStateChange() {
  var readyState = sendChannel.readyState;
  trace('Send channel state is: ' + readyState);
  console.log('.')
  if (readyState === 'open') {
    dataChannelSend.disabled = false;
    dataChannelSend.focus();
    sendButton.disabled = false;
    closeButton.disabled = false;
  } else {
    dataChannelSend.disabled = true;
    sendButton.disabled = true;
    closeButton.disabled = true;
  }
}

function onReceiveChannelStateChange() {
  var readyState = receiveChannel.readyState;
  trace('Receive channel state is: ' + readyState);
  console.log('.') 
}

function trace(text) {
  if (text[text.length - 1] === '\n') {
    text = text.substring(0, text.length - 1);
  }
  if (window.performance) {
    var now = (window.performance.now() / 1000).toFixed(3);
    console.log(now + ': ' + text);
  } else {
    console.log(text);
  }
}
