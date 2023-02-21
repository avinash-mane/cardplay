import { initializeApp } from "firebase/app";
import { getFirestore } from "@firebase/firestore";
const firebaseConfig = {
    apiKey: "AIzaSyAWBao_ZI8vLJIloZ4RN-iiwpCpQyjYznM",
    authDomain: "ticket-afeb3.firebaseapp.com",
    projectId: "ticket-afeb3",
    storageBucket: "ticket-afeb3.appspot.com",
    messagingSenderId: "12088333664",
    appId: "1:12088333664:web:5c99748047e3c7e964fa05",
    measurementId: "G-TKVGNV2VSX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const fireStore = getFirestore(app)