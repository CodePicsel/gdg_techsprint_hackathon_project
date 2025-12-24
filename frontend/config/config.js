export const config = {
    // Backend
    api_url : String(import.meta.env.VITE_API_URL),

    // Firebase 
    firebase_api_key : String(import.meta.env.VITE_FIREBASE_API_KEY) ,
    firebase_auth_domain : String(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
    firebase_project_id : String(import.meta.env.VITE_FIREBASE_PROJECT_ID) ,
    firebase_storage_bucket : String(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) ,
    firebase_message_id : String(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) ,
    firebase_app_id : String(import.meta.env.VITE_FIREBASE_APP_ID) 
}