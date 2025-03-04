# AI Writing App

A Next.js application for AI-assisted writing with Firebase integration.

## Setup Instructions

### Prerequisites
- Node.js (v18 or later)
- npm or yarn
- A Firebase account

### Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)

2. Enable the following Firebase services:
   - Authentication
   - Firestore Database
   - Cloud Functions
   - Storage (if needed for file uploads)

3. Create a `.env.local` file in the project root with your Firebase configuration:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. Set up Firestore Security Rules:
   - Copy the contents of `firestore.rules` to your Firebase Console
   - Deploy the rules through the Firebase Console or using the Firebase CLI

5. Deploy Cloud Functions:
   ```bash
   cd functions
   npm install
   npm run deploy
   ```

### Local Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Project Structure

- `/lib/firebase.ts` - Firebase initialization and configuration
- `/lib/firebase-context.tsx` - Firebase context provider
- `/lib/services/` - Firebase service implementations
- `/functions/` - Cloud Functions implementation

### Firebase Features

This project uses the following Firebase features:
- **Authentication**: User management and session handling
- **Firestore**: Document storage for projects and notes
- **Cloud Functions**: Server-side processing with AI integration
- **Security Rules**: Secure data access and validation

### Development Notes

- The project uses Firebase Web v9 SDK with modular imports
- Cloud Functions are implemented in TypeScript
- Local emulator support is available for development
- Environment variables must be properly set for both local development and production

### Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy to your hosting platform of choice (Vercel recommended for Next.js)

3. Ensure all Firebase services are properly configured in production

### Troubleshooting

- If you encounter CORS issues, check your Firebase project settings
- For Cloud Functions errors, check the Firebase Console logs
- Ensure all environment variables are properly set
- Verify Firebase initialization in browser console 