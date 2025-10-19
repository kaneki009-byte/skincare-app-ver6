import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBrNtw-yDO4vRsIqKEjqgD2Qw4OHO9lgNs",
  authDomain: "skin-care-tracker-e7b88.firebaseapp.com",
  projectId: "skin-care-tracker-e7b88",
  storageBucket: "skin-care-tracker-e7b88.firebasestorage.app",
  messagingSenderId: "694240538671",
  appId: "1:694240538671:web:642a1068e117727aa656da"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const auth = getAuth(app);
signInAnonymously(auth)
  .then(() => console.log("匿名ログイン成功"))
  .catch((e) => console.error("匿名ログイン失敗:", e));
