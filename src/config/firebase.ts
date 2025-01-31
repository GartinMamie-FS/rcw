import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBHDKop-D6gvQG4z4ZF_tfDxBpA7xgS27s",
    authDomain: "recovery-connect-web.firebaseapp.com",
    projectId: "recovery-connect-web",
    storageBucket: "recovery-connect-web.firebasestorage.app",
    messagingSenderId: "236368090937",
    appId: "1:236368090937:web:a60886259c6fd793323ae8",
    measurementId: "G-CXKR227NC0"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

// Auth functions you can use throughout your app
export const signIn = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const signUp = (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
};

export const logOut = () => {
    return signOut(auth);
};

export { app, analytics, auth };
