import { Html5Qrcode } from "https://unpkg.com/html5-qrcode@2.3.8/minified/html5-qrcode.min.js";

const html5QrCode = new Html5Qrcode("reader");

Html5Qrcode.getCameras().then(cameras => {
  if (cameras && cameras.length) {
    const cam = cameras[0]; // kamera pertama
    html5QrCode.start(
      { deviceId: { exact: cam.id } },
      { fps: 10, qrbox: 250 },
      decodedText => document.getElementById("status").innerText = "QR: " + decodedText
    );
  } else {
    document.getElementById("status").innerText = "Tidak ada kamera";
  }
}).catch(err => {
  document.getElementById("status").innerText = "Error: " + err;
});
