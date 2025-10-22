import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

// Firebaseの設定を.envから読み込む
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Firebaseを初期化
const app = initializeApp(firebaseConfig);

// Firestoreデータベースをエクスポート
export const db = getFirestore(app);

// 共通ログイン用の認証設定
const auth = getAuth(app);
signInWithEmailAndPassword(auth, "nurse@test.com", "123456")
  .then(() => console.log("✅ 共通アカウントでログイン成功"))
  .catch((e) => console.error("❌ ログイン失敗:", e));


