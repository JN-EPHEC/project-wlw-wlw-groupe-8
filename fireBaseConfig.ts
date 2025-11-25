import { initializeApp } from "firebase/app";
import { initializeAuth } from 'firebase/auth';
  const firebaseConfig = {
    apiKey: "AIzaSyCQmXxgDMxNFUJvoAEl-Ujii9L66r6Cw0I",
    authDomain: "speedevents-25.firebaseapp.com",
    projectId: "speedevents-25",
    storageBucket: "speedevents-25.firebasestorage.app",
    messagingSenderId: "580266511189",
    appId: "1:580266511189:web:cbcca49d52f21c4977bddc"
  };
  export const app = initializeApp(firebaseConfig);
  export const auth = initializeAuth(app);