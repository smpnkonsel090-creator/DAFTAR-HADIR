// config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyCAg9Kb4I3dp-fcCIp5RzQKY8mJ3sD4hPU",
  authDomain: "absensi-smpn-20-konsel.firebaseapp.com",
  projectId: "absensi-smpn-20-konsel",
  storageBucket: "absensi-smpn-20-konsel.appspot.com",
  messagingSenderId: "247838919432",
  appId: "1:247838919432:web:4505c7d499fb5d716dfabd",
  measurementId: "G-1TNJRBYFEV"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
