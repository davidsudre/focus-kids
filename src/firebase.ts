import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Config from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyARtliPp0aq4Q-CmNgB4DwIsMTboWqgw90",
  authDomain: "gen-lang-client-0289271537.firebaseapp.com",
  projectId: "gen-lang-client-0289271537",
  storageBucket: "gen-lang-client-0289271537.firebasestorage.app",
  messagingSenderId: "957630410803",
  appId: "1:957630410803:web:914a7e10344bfb3b1c7346"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
