import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDr0zlHDuae7ILp6ekrUgZPHa_TFqb5Wbc",
  authDomain: "controle-de-carteira.firebaseapp.com",
  databaseURL: "https://controle-de-carteira-default-rtdb.firebaseio.com",
  projectId: "controle-de-carteira",
  storageBucket: "controle-de-carteira.appspot.com",
  messagingSenderId: "138372052472",
  appId: "1:138372052472:web:98f4dcc41d6f061f61120d",
  measurementId: "G-G7HM7S79KS"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export default app;
