const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

navigator.mediaDevices.getUserMedia({
    video: {facingMode: "user"}
}).then (stream => {
    video.srcObject = stream;
});

const faceMesh = new FaceMesh({
  locateFile: file => 
    `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
});

faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

faceMesh.onResults(onResults);

const camera = new Camera(video, {
  onFrame: async () => {
    await faceMesh.send({ image: video });
  },
  width: 640,
  height: 480
});
camera.start();



function getEyePoints(face) {
  const left = face[33];
  const right = face[263];

  return {
    leftEye: { x: left.x * canvas.width, y: left.y * canvas.height },
    rightEye: { x: right.x * canvas.width, y: right.y * canvas.height }
  };
}

function getRotation(leftEye, rightEye) {
  return Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
}

function getScale(leftEye, rightEye) {
  const dx = rightEye.x - leftEye.x;
  const dy = rightEye.y - leftEye.y;
  return Math.sqrt(dx*dx + dy*dy);
}

const glasses = new Image();
glasses.src = "filters/glasses.png";


function onResults(results) {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  if (results.multiFaceLandmarks) {
    const face = results.multiFaceLandmarks[0];
    const { leftEye, rightEye } = getEyePoints(face);
    const angle = getRotation(leftEye, rightEye);
    const scale = getScale(leftEye, rightEye);

    const centerX = (leftEye.x + rightEye.x) / 2;
    const centerY = (leftEye.y + rightEye.y) / 2;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    ctx.drawImage(glasses, -scale/1.2, -scale/3, scale*1.7, scale/1.2);
    ctx.restore();
  }
}