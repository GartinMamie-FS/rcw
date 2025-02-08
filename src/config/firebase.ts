import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyBHDKop-D6gvQG4z4ZF_tfDxBpA7xgS27s",
    authDomain: "recovery-connect-web.firebaseapp.com",
    databaseURL: "https://recovery-connect-web-default-rtdb.firebaseio.com",
    projectId: "recovery-connect-web",
    storageBucket: "recovery-connect-web.firebasestorage.app",
    messagingSenderId: "236368090937",
    appId: "1:236368090937:web:a60886259c6fd793323ae8",
    measurementId: "G-CXKR227NC0"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize and export services
export const auth = getAuth();
export const firestore = getFirestore();
export const database = getDatabase();
export let analytics: any = null;

isSupported().then(supported => {
    if (supported) {
        analytics = getAnalytics(app);
    }
});

// Enable easier debugging in development
if (process.env.NODE_ENV === 'development') {
    // @ts-ignore
    window.firebase = { auth, firestore, database, analytics };
}

// Export the config for secondary apps
export { firebaseConfig };
