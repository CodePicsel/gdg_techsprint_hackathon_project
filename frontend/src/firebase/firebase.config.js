import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { config } from '../../config/config';

const firebaseConfig = {
  apiKey: config.firebase_api_key,
  authDomain: config.firebase_auth_domain,
  projectId: config.firebase_project_id,
  storageBucket: config.firebase_storage_bucket,
  messagingSenderId: config.firebase_message_id,
  appId: config.firebase_app_id
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const functions = getFunctions(app);

export default app; 