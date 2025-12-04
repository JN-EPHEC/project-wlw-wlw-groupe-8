import { initializeAuth } from '@firebase/auth';
//@ts-ignore
import { getReactNativePersistence } from '@firebase/auth/dist/rn/index.js';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";


  const firebaseConfig = {
    apiKey: "AIzaSyCQmXxgDMxNFUJvoAEl-Ujii9L66r6Cw0I",
    authDomain: "speedevents-25.firebaseapp.com",
    projectId: "speedevents-25",
    storageBucket: "speedevents-25.firebasestorage.app",
    messagingSenderId: "580266511189",
    appId: "1:580266511189:web:cbcca49d52f21c4977bddc"
  };
  export const app = initializeApp(firebaseConfig);
  export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
  export const db = getFirestore(app);