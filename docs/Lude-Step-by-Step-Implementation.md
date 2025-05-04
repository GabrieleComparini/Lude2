# Lude Backend - Detailed Step-by-Step Implementation Guide

This guide provides a detailed walkthrough for implementing the backend server for the Lude (Track Master) application, based on `lude-specifications.md` and `Detailed Step Implementation.md`. It assumes you have completed the initial "Development Environment Setup" and "Project Structure and Version Control" steps outlined in `Detailed Step Implementation.md`.

**Target Directory:** All commands and file paths are relative to the `apps/server` directory unless otherwise specified.

**Prerequisites:**
*   Node.js & npm installed.
*   Git initialized in the project root (`lude/`).
*   Base project structure (`apps/server/`, `docs/`) created.
*   MongoDB Atlas cluster created and connection string obtained.
*   Firebase project created.
*   Cloudinary account created.
*   Render account created (optional for initial local development, required for deployment).

---

## Phase 1: Core Setup & Authentication

### Step 1: Initialize Backend Project

1.  **Navigate to Server Directory:**
    ```bash
    cd apps/server
    ```
2.  **Initialize npm:** Creates `package.json`.
    ```bash
    npm init -y
    ```
3.  **Install Core Dependencies:**
    *   `express`: Web framework.
    *   `mongoose`: MongoDB ODM (Object Data Modeling) library.
    *   `dotenv`: Loads environment variables from a `.env` file.
    *   `cors`: Enables Cross-Origin Resource Sharing.
    *   `firebase-admin`: For verifying Firebase Authentication tokens on the backend.
    *   `cloudinary`: For interacting with the Cloudinary API (image storage).
    ```bash
    npm install express mongoose dotenv cors firebase-admin cloudinary
    ```
4.  **Install Development Dependencies:**
    *   `nodemon`: Automatically restarts the server during development on file changes.
    ```bash
    npm install -D nodemon
    ```
5.  **Configure `nodemon` (Optional):** Add a `nodemon.json` file in `apps/server` for configuration (e.g., watching specific directories, ignoring files).
    ```json
    // nodemon.json
    {
      "watch": ["src"],
      "ext": "js,json",
      "ignore": ["src/tests/**/*.test.js"],
      "exec": "node src/server.js"
    }
    ```
6.  **Add Scripts to `package.json`:**
    ```json
    // package.json
    "scripts": {
      "start": "node src/server.js",
      "dev": "nodemon src/server.js", // Or just "nodemon" if using nodemon.json
      "test": "echo \\"Error: no test specified\\" && exit 1"
    },
    ```

### Step 2: Basic Server Structure

1.  **Create Source Directory:**
    ```bash
    mkdir src
    ```
2.  **Create Subdirectories within `src`:** Based on the recommended structure in `lude-specifications.md`.
    ```bash
    cd src
    mkdir config controllers middleware models routes services utils
    cd ..
    ```
    *   `config`: Configuration files (database connection, environment variables loading).
    *   `controllers`: Request handlers, interact with services.
    *   `middleware`: Express middleware functions (authentication checks, validation, logging, error handling).
    *   `models`: Mongoose schemas and models for database collections.
    *   `routes`: API route definitions, mapping endpoints to controllers.
    *   `services`: Business logic, database interactions.
    *   `utils`: Helper functions, constants.

### Step 3: Environment Configuration

1.  **Create `.env` file:** In the `apps/server` directory. **Crucially, add `.env` to your root `.gitignore` file immediately.**
    ```bash
    touch .env
    ```
2.  **Add Environment Variables to `.env`:** Populate it with secrets and configurations. Get values from MongoDB Atlas, Firebase, and Cloudinary setup.
    ```dotenv
    # .env (Example - Replace with your actual values)

    # Server Configuration
    PORT=3001

    # MongoDB Atlas
    DATABASE_URL=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority&appName=<app-name>

    # Firebase Admin SDK (Service Account Key)
    # Option 1: Path to the downloaded JSON key file (relative to apps/server)
    # GOOGLE_APPLICATION_CREDENTIALS=./path/to/your/serviceAccountKey.json
    # Option 2: Store key components directly (more secure for some hosting like Render)
    FIREBASE_PROJECT_ID=your-firebase-project-id
    FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
    FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY\\n-----END PRIVATE KEY-----\\n" # Ensure newlines are escaped correctly (\n)

    # Cloudinary
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret

    # JWT Secret (If using custom JWTs alongside Firebase, otherwise optional)
    # JWT_SECRET=a_very_strong_and_secret_key
    ```
3.  **Load Environment Variables:** Create `src/config/environment.js` to load and export variables using `dotenv`.
    ```javascript
    // src/config/environment.js
    const dotenv = require('dotenv');
    const path = require('path');

    // Load .env file from the parent directory (apps/server)
    dotenv.config({ path: path.resolve(__dirname, '../../.env') });

    const environment = {
        port: process.env.PORT || 3001,
        databaseUrl: process.env.DATABASE_URL,
        firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
        firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\\n'), // Handle escaped newlines
        googleCredentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS, // Alternative if using file path
        cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
        cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
        cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
        // jwtSecret: process.env.JWT_SECRET, // Uncomment if using JWT
    };

    // Basic validation (optional but recommended)
    if (!environment.databaseUrl) {
        console.error("FATAL ERROR: DATABASE_URL is not defined.");
        process.exit(1);
    }
    // Add more checks for essential variables

    module.exports = environment;
    ```

### Step 4: Database Connection (MongoDB with Mongoose)

1.  **Create Database Configuration:** Create `src/config/database.js`.
    ```javascript
    // src/config/database.js
    const mongoose = require('mongoose');
    const environment = require('./environment');

    const connectDB = async () => {
        try {
            await mongoose.connect(environment.databaseUrl, {
                // Recommended options (check Mongoose docs for latest)
                // useNewUrlParser: true, // Deprecated
                // useUnifiedTopology: true, // Deprecated
                // useCreateIndex: true, // Not supported
                // useFindAndModify: false // Not supported
            });
            console.log('MongoDB Connected Successfully');
        } catch (err) {
            console.error('MongoDB Connection Error:', err.message);
            // Exit process with failure
            process.exit(1);
        }
    };

    module.exports = connectDB;
    ```

### Step 5: Firebase Admin SDK Initialization

1.  **Create Firebase Configuration:** Create `src/config/firebaseAdmin.js`.
    ```javascript
    // src/config/firebaseAdmin.js
    const admin = require('firebase-admin');
    const environment = require('./environment');

    try {
        const serviceAccount = environment.googleCredentialsPath
            ? require(environment.googleCredentialsPath) // Load from file path if provided
            : { // Load from environment variables otherwise
                projectId: environment.firebaseProjectId,
                clientEmail: environment.firebaseClientEmail,
                privateKey: environment.firebasePrivateKey, // Already formatted with newlines
              };

        if (!serviceAccount.projectId) {
            throw new Error("Firebase Admin SDK configuration is missing. Check .env file.");
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            // databaseURL: `https://${environment.firebaseProjectId}.firebaseio.com` // Optional: If using Realtime DB features
        });

        console.log('Firebase Admin SDK Initialized Successfully');

    } catch (error) {
        console.error('Firebase Admin SDK Initialization Error:', error.message);
        process.exit(1);
    }

    module.exports = admin;
    ```

### Step 6: Cloudinary Configuration

1.  **Create Cloudinary Configuration:** Create `src/config/cloudinary.js`.
    ```javascript
    // src/config/cloudinary.js
    const cloudinary = require('cloudinary').v2;
    const environment = require('./environment');

    if (!environment.cloudinaryCloudName || !environment.cloudinaryApiKey || !environment.cloudinaryApiSecret) {
        console.warn('Cloudinary configuration is missing. Upload features will be disabled.');
    } else {
        cloudinary.config({
            cloud_name: environment.cloudinaryCloudName,
            api_key: environment.cloudinaryApiKey,
            api_secret: environment.cloudinaryApiSecret,
            secure: true // Use HTTPS
        });
        console.log('Cloudinary SDK Initialized Successfully');
    }

    module.exports = cloudinary;

    ```

### Step 7: Core Express Server Setup

1.  **Create Main Server File:** Create `src/server.js`.
    ```javascript
    // src/server.js
    const express = require('express');
    const cors = require('cors');
    const environment = require('./config/environment');
    const connectDB = require('./config/database');
    require('./config/firebaseAdmin'); // Initialize Firebase Admin SDK
    require('./config/cloudinary'); // Initialize Cloudinary SDK

    // --- Database Connection ---
    connectDB();

    // --- Initialize Express App ---
    const app = express();

    // --- Core Middlewares ---
    app.use(cors()); // Enable CORS for all origins (adjust in production!)
    app.use(express.json()); // Parse JSON request bodies
    app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

    // --- Basic Test Route ---
    app.get('/', (req, res) => {
        res.json({ message: 'Welcome to Lude (Track Master) Backend API!' });
    });

    // --- API Routes (To be added later) ---
    // app.use('/api/auth', require('./routes/authRoutes'));
    // app.use('/api/users', require('./routes/userRoutes'));
    // app.use('/api/tracks', require('./routes/trackRoutes'));
    // ... other routes

    // --- Global Error Handler (To be added later) ---
    // app.use(require('./middleware/errorHandler'));

    // --- Start Server ---
    const PORT = environment.port;
    const server = app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });

    // --- Handle Unhandled Promise Rejections ---
    process.on('unhandledRejection', (err, promise) => {
        console.error(`Unhandled Rejection: ${err.message}`);
        // Close server & exit process
        server.close(() => process.exit(1));
    });

    // --- Handle SIGTERM (for hosting platforms like Render) ---
    process.on('SIGTERM', () => {
        console.log('SIGTERM received. Shutting down gracefully.');
        server.close(() => {
            console.log('Process terminated.');
            process.exit(0);
        });
    });
    ```
2.  **Run the Server (Development):**
    ```bash
    npm run dev
    ```
    You should see logs indicating successful connections to MongoDB, Firebase Admin, Cloudinary (if configured), and the server starting. You can test the basic route by visiting `http://localhost:3001` in your browser or using `curl`.

### Step 8: User Model Definition

1.  **Create User Schema:** Create `src/models/User.js` based on the detailed schema in `lude-specifications.md`.
    ```javascript
    // src/models/User.js
    const mongoose = require('mongoose');
    const Schema = mongoose.Schema;

    const UserSchema = new Schema({
        firebaseUid: { // Store the Firebase UID as the primary link
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        email: { // Denormalized from Firebase for easier querying/display
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [/.+\@.+\..+/, 'Please fill a valid email address'],
            index: true,
        },
        username: { // User-chosen unique username
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 30,
            index: true,
        },
        name: { // Display name
            type: String,
            trim: true,
            maxlength: 50
        },
        profileImage: {
            type: String, // URL to Cloudinary image
            default: null // Or a default image URL
        },
        bio: {
            type: String,
            maxlength: 160,
            default: ''
        },
        registrationDate: {
            type: Date,
            default: Date.now
        },
        lastLogin: {
            type: Date
        },
        preferences: {
            units: {
                type: String,
                enum: ['metric', 'imperial'], // 'metric' (km/h, m, kg), 'imperial' (mph, miles, lbs)
                default: 'metric'
            },
            privacy: {
                profileVisibility: {
                    type: String,
                    enum: ['public', 'connections', 'private'],
                    default: 'public'
                },
                trackVisibilityDefault: {
                    type: String, // Default setting when saving a track
                    enum: ['public', 'private'],
                    default: 'private'
                }
            },
            notifications: {
                newFollower: { type: Boolean, default: true },
                trackComment: { type: Boolean, default: true },
                trackReaction: { type: Boolean, default: true },
                achievementUnlocked: { type: Boolean, default: true }
            }
        },
        statistics: {
            totalDistance: { type: Number, default: 0 }, // Store in meters
            totalTime: { type: Number, default: 0 }, // Store in seconds
            totalTracks: { type: Number, default: 0 },
            topSpeed: { type: Number, default: 0 }, // Store in m/s
            avgSpeed: { type: Number, default: 0 } // Store in m/s (running average, maybe update less often)
        },
        // achievementsEarned: [{ // Consider a separate collection if it grows large
        //     achievement: { type: Schema.Types.ObjectId, ref: 'Achievement' },
        //     earnedAt: { type: Date, default: Date.now }
        // }],
        connections: [{ // Users this user is connected to/following
            type: Schema.Types.ObjectId,
            ref: 'User'
        }],
        followers: [{ // Users following this user (optional, can be derived)
            type: Schema.Types.ObjectId,
            ref: 'User'
        }],
        // vehicles: [{ type: Schema.Types.ObjectId, ref: 'Vehicle' }] // Populate from Vehicle collection
    }, {
        timestamps: true // Adds createdAt and updatedAt automatically
    });

    // --- Methods ---
    // Example: Method to update statistics safely
    UserSchema.methods.updateStats = async function(trackStats) {
        this.statistics.totalDistance += trackStats.distance;
        this.statistics.totalTime += trackStats.duration;
        this.statistics.totalTracks += 1;
        if (trackStats.maxSpeed > this.statistics.topSpeed) {
            this.statistics.topSpeed = trackStats.maxSpeed;
        }
        // Recalculate avgSpeed if needed, or store sufficient data to do so
        // this.statistics.avgSpeed = ... calculate ...
        await this.save();
    };

    // --- Virtuals ---
    // Example: Virtual for profile completion percentage
    UserSchema.virtual('profileCompletion').get(function() {
        let score = 0;
        if (this.name) score += 25;
        if (this.profileImage) score += 25;
        if (this.bio) score += 25;
        if (this.vehicles && this.vehicles.length > 0) score += 25; // Requires vehicle model setup
        return score;
    });

    // Ensure virtual fields are included when converting to JSON/Object
    UserSchema.set('toJSON', { virtuals: true });
    UserSchema.set('toObject', { virtuals: true });


    module.exports = mongoose.model('User', UserSchema);

    ```

### Step 9: Authentication Middleware

1.  **Create Auth Middleware:** Create `src/middleware/authMiddleware.js` to verify Firebase ID tokens sent from the frontend.
    ```javascript
    // src/middleware/authMiddleware.js
    const admin = require('../config/firebaseAdmin');
    const User = require('../models/User'); // Assuming User model exists

    const protect = async (req, res, next) => {
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            try {
                // Get token from header
                token = req.headers.authorization.split(' ')[1];

                // Verify token using Firebase Admin SDK
                const decodedToken = await admin.auth().verifyIdToken(token);

                // Find user in your DB using the Firebase UID
                // Select excludes password if you were storing one (not needed with Firebase Auth)
                req.user = await User.findOne({ firebaseUid: decodedToken.uid }).select('-password');

                if (!req.user) {
                    // Optional: Auto-create user in DB if they exist in Firebase but not locally?
                    // Or just throw an error. For now, assume user must exist.
                    console.warn(`User with firebaseUid ${decodedToken.uid} not found in DB.`);
                   return res.status(401).json({ message: 'Not authorized, user not found in database' });
                }

                next(); // Proceed to the next middleware/controller
            } catch (error) {
                console.error('Authentication Error:', error);
                 if (error.code === 'auth/id-token-expired') {
                    return res.status(401).json({ message: 'Not authorized, token expired' });
                 }
                res.status(401).json({ message: 'Not authorized, token failed' });
            }
        }

        if (!token) {
            res.status(401).json({ message: 'Not authorized, no token' });
        }
    };

    // Optional: Middleware for specific roles (if you implement roles)
    const adminOnly = (req, res, next) => {
        if (req.user && req.user.isAdmin) { // Assumes an 'isAdmin' field on your User model
            next();
        } else {
            res.status(403).json({ message: 'Not authorized as an admin' });
        }
    };


    module.exports = { protect, adminOnly };

    ```

### Step 10: Authentication Routes & Controllers

1.  **Create Auth Controller:** Create `src/controllers/authController.js`. This controller will handle tasks like syncing Firebase user data with your local DB upon first login/registration.
    ```javascript
    // src/controllers/authController.js
    const User = require('../models/User');
    const admin = require('../config/firebaseAdmin'); // Needed if fetching user data from Firebase

    // @desc    Register/Login user & sync with DB
    // @route   POST /api/auth/sync
    // @access  Private (Requires valid Firebase token via 'protect' middleware)
    const syncUser = async (req, res) => {
        // The 'protect' middleware already verified the token and attached req.user
        // If req.user exists, they are already in the DB.
        // If protect middleware was modified to auto-create, handle that case.
        // This endpoint primarily ensures the user exists in our DB after Firebase auth.

        const firebaseUid = req.user.firebaseUid; // From protect middleware

        try {
            let user = await User.findOne({ firebaseUid });

            if (user) {
                // User exists, update last login time
                user.lastLogin = Date.now();
                await user.save();
                res.status(200).json({
                    _id: user._id,
                    firebaseUid: user.firebaseUid,
                    email: user.email,
                    username: user.username,
                    name: user.name,
                    profileImage: user.profileImage,
                    // Include other necessary fields for the frontend session
                });
            } else {
                 // This case implies the user exists in Firebase but NOT in our DB.
                 // This usually happens on the very first login after Firebase signup.
                 // We need info from the Firebase token (email) and potentially require
                 // the client to send username/name in the request body for initial setup.

                 const { email, name, username } = req.body; // Client MUST send required fields
                 const firebaseUser = await admin.auth().getUser(firebaseUid); // Get full Firebase user data

                 if (!username || !firebaseUser.email) {
                     return res.status(400).json({ message: 'Username and email are required for initial sync.' });
                 }

                 // Check if username or email already taken (by another account?)
                 const existingUsername = await User.findOne({ username });
                 if (existingUsername) {
                     return res.status(400).json({ message: 'Username already taken.' });
                 }
                 // Email uniqueness is likely handled by Firebase, but double-check if needed

                 user = await User.create({
                     firebaseUid: firebaseUid,
                     email: firebaseUser.email, // Use verified email from Firebase
                     username: username, // From request body
                     name: name || firebaseUser.displayName, // From body or Firebase
                     profileImage: firebaseUser.photoURL, // Use photo from Firebase if available
                     lastLogin: Date.now(),
                 });

                 res.status(201).json({ // 201 Created
                     _id: user._id,
                     firebaseUid: user.firebaseUid,
                     email: user.email,
                     username: user.username,
                     name: user.name,
                     profileImage: user.profileImage,
                 });
            }
        } catch (error) {
            console.error("User Sync Error:", error);
            res.status(500).json({ message: 'Server error during user sync' });
        }
    };


    module.exports = {
        syncUser,
    };
    ```
2.  **Create Auth Routes:** Create `src/routes/authRoutes.js`.
    ```javascript
    // src/routes/authRoutes.js
    const express = require('express');
    const { syncUser } = require('../controllers/authController');
    const { protect } = require('../middleware/authMiddleware');

    const router = express.Router();

    // This single endpoint handles both registration (initial sync) and login (subsequent syncs)
    // The client authenticates with Firebase first, gets an ID token, then calls this endpoint.
    router.post('/sync', protect, syncUser);

    // Note: Traditional /register and /login endpoints are NOT needed here
    // because Firebase handles the actual authentication process.

    // Optional: Add routes for password reset requests (if not handled client-side via Firebase)
    // or email verification triggers if needed.

    module.exports = router;

    ```
3.  **Mount Auth Routes in `server.js`:** Uncomment or add the line in `src/server.js`:
    ```javascript
    // src/server.js
    // ... other code
    app.use('/api/auth', require('./routes/authRoutes'));
    // ... other code
    ```

### Step 11: Deployment Setup (Render Example)

1.  **Ensure `.gitignore` is Correct:** Make sure `node_modules/`, `.env`, `*.log`, and any service account key files (`*.json`) are ignored.
2.  **Configure Render Service:**
    *   Connect your GitHub repository to Render.
    *   Create a new "Web Service".
    *   **Name:** e.g., `lude-backend`
    *   **Root Directory:** `apps/server` (Crucial!)
    *   **Environment:** Node
    *   **Region:** Choose a suitable region.
    *   **Branch:** `main` (or your deployment branch).
    *   **Build Command:** `npm install`
    *   **Start Command:** `npm start` (which runs `node src/server.js`)
    *   **Plan:** Free (initially)
3.  **Add Environment Variables on Render:** Go to your service's "Environment" settings on Render.
    *   Add `DATABASE_URL` with your full MongoDB Atlas connection string.
    *   Add `PORT` (Render sets this automatically, but you can define it, e.g., `3001`).
    *   Add Firebase variables (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`). **Important:** When pasting the private key, ensure it includes the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines and that newlines are preserved correctly (Render often handles multi-line variables well, but double-check). *Avoid using the file path method (`GOOGLE_APPLICATION_CREDENTIALS`) on Render unless you configure file uploads during build.*
    *   Add Cloudinary variables (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).
    *   Set `NODE_ENV` to `production`.
4.  **Trigger Deployment:** Commit and push your changes to the linked GitHub branch. Render should automatically build and deploy. Check the logs on Render for any errors.

---

## Phase 2: User Profile & Vehicle Management

*(Detailed implementation for these steps would follow a similar pattern: Define Model -> Create Service (optional) -> Create Controller -> Create Routes -> Mount Routes)*

### Step 12: User Profile Routes & Controller

*   **Model:** `User.js` (already created).
*   **Controller (`userController.js`):**
    *   `getUserProfile`: (GET `/api/users/profile`) - Gets the logged-in user's profile (uses `protect` middleware, gets user from `req.user`).
    *   `updateUserProfile`: (PUT `/api/users/profile`) - Updates fields like `name`, `username`, `bio`, `preferences`. Ensure username uniqueness check if changed.
    *   `getPublicUserProfile`: (GET `/api/users/:username`) - Gets public profile data for a given username. Select only public fields.
    *   `searchUsers`: (GET `/api/users/search?q=...`) - Search users by username or name.
*   **Routes (`userRoutes.js`):** Map paths to controller functions, apply `protect` middleware where needed.
*   **Mount Routes:** `app.use('/api/users', require('./routes/userRoutes'));` in `server.js`.

### Step 13: Vehicle Model, Routes & Controller

*   **Model (`Vehicle.js`):** Define schema based on `lude-specifications.md` (fields: `userId`, `type`, `make`, `model`, `year`, `color`, `nickname`, `specs`, `imageUrl`). Include `userId` index.
*   **Controller (`vehicleController.js`):**
    *   `addVehicle`: (POST `/api/users/vehicles`) - Adds a new vehicle linked to `req.user._id`.
    *   `getUserVehicles`: (GET `/api/users/vehicles`) - Gets all vehicles for the logged-in user.
    *   `getVehicleById`: (GET `/api/users/vehicles/:id`) - Gets a specific vehicle, ensuring it belongs to the logged-in user.
    *   `updateVehicle`: (PUT `/api/users/vehicles/:id`) - Updates a vehicle, ensuring ownership.
    *   `deleteVehicle`: (DELETE `/api/users/vehicles/:id`) - Deletes a vehicle, ensuring ownership.
*   **Routes (`vehicleRoutes.js`):** Often nested under user routes or standalone `/api/vehicles`. Use `protect` middleware. Attach to the User routes or mount separately. Example nested: `userRouter.use('/vehicles', require('./vehicleRoutes'));`
*   **Update User Model:** Add `vehicles: [{ type: Schema.Types.ObjectId, ref: 'Vehicle' }]` to `UserSchema` if not already done (or manage the relationship primarily from the Vehicle side via `userId`).

### Step 14: Image Upload Integration (Cloudinary)

*   **Middleware (`uploadMiddleware.js`):** Use `multer` to handle file uploads from requests and `cloudinary` SDK to upload to the cloud.
    ```bash
    npm install multer
    ```
    ```javascript
    // src/middleware/uploadMiddleware.js - Example using Multer memory storage
    const multer = require('multer');
    const path = require('path');
    const cloudinary = require('../config/cloudinary');
    const { CloudinaryStorage } = require('multer-storage-cloudinary'); // Need to install this: npm install multer-storage-cloudinary

    // Configure Cloudinary Storage for Multer
    const storage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: async (req, file) => {
        // Determine folder and format based on request or file type
        let folder = 'user_profiles'; // Default folder
        if (req.baseUrl.includes('/vehicles')) { // Example check based on route path
             folder = 'vehicle_images';
        }
        // Add more logic based on file type, user ID, etc.

        return {
          folder: `lude/${folder}`, // Organize within a main 'lude' folder
          // transformation: [{ width: 500, height: 500, crop: "limit" }], // Optional transformations
          public_id: `${req.user._id}_${file.fieldname}_${Date.now()}`, // Create a unique public ID
          format: 'jpg', // Or derive from file.mimetype, e.g., file.mimetype.split('/')[1]
        };
      },
    });

     // File Filter (optional)
     const fileFilter = (req, file, cb) => {
       const allowedTypes = /jpeg|jpg|png|gif/;
       const mimetype = allowedTypes.test(file.mimetype);
       const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

       if (mimetype && extname) {
         return cb(null, true);
       } else {
         cb(new Error('Error: Images Only!'), false);
       }
     };

    const upload = multer({
        storage: storage,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
        fileFilter: fileFilter
     });

    module.exports = upload;
    ```
*   **Update Controllers:** Modify `updateUserProfile` and `addVehicle`/`updateVehicle` controllers.
    *   Use `upload.single('profileImage')` or `upload.single('vehicleImage')` as middleware on the specific route.
    *   Access the uploaded file URL from `req.file.path` (Cloudinary URL) and save it to the respective model (`profileImage` or `imageUrl`).
    *   Handle potential upload errors.

---

## Phase 3: Tracking & Social Features

*(Continue the pattern: Model -> Service -> Controller -> Routes -> Mount)*

### Step 15: Track Model

*   **Model (`Track.js`):** Define schema based on `lude-specifications.md`. Pay attention to:
    *   `userId`, `vehicleId` (indexed).
    *   `startTime`, `endTime` (indexed).
    *   `duration`, `distance`, `avgSpeed`, `maxSpeed` (store in consistent units, e.g., seconds, meters, m/s).
    *   `startLocation`, `endLocation` (GeoJSON Point format: `{ type: 'Point', coordinates: [lng, lat] }`). Create `2dsphere` index on at least `startLocation`.
    *   `route`: Array of points (`{ lat, lng, speed, altitude, timestamp }`). Consider if storing the full route is feasible or if simplification/sampling is needed for performance.
    *   `routeSimplified`: Optional GeoJSON LineString for map previews.
    *   `isPublic` (indexed).
    *   `tags` (indexed).
    *   Denormalized counts/data: `commentsCount`, `reactions` object.

### Step 16: Track Routes & Controller

*   **Controller (`trackController.js`):**
    *   `startTrack`: (POST `/api/tracks/start`) - Maybe not strictly needed if client handles start, but could initialize a record.
    *   `saveTrack`: (POST `/api/tracks`) - Receives full track data from client after completion. Performs calculations (duration, avgSpeed, etc.) if not done client-side. Saves track to DB. Updates user statistics.
    *   `getTrackById`: (GET `/api/tracks/:id`) - Gets track details. Checks public status or ownership.
    *   `getUserTracks`: (GET `/api/tracks/list`) - Gets logged-in user's tracks with pagination/filtering.
    *   `getPublicTracks`: (GET `/api/tracks/public`) - Gets public tracks with pagination/filtering/sorting.
    *   `updateTrack`: (PUT `/api/tracks/:id`) - Allows updating description, tags, `isPublic` status. Check ownership.
    *   `deleteTrack`: (DELETE `/api/tracks/:id`) - Deletes a track. Check ownership.
*   **Routes (`trackRoutes.js`):** Map paths, use `protect`.
*   **Mount Routes:** `app.use('/api/tracks', require('./routes/trackRoutes'));`

### Step 17: Social Features (Connections, Comments, Reactions)

*   **Connections (in `userController.js` / `userRoutes.js`):**
    *   `followUser`: (POST `/api/users/:id/follow`) - Add target user ID to `req.user.connections`. Add `req.user._id` to target user's `followers` (if using).
    *   `unfollowUser`: (DELETE `/api/users/:id/follow`) - Remove IDs.
    *   `getConnections`: (GET `/api/users/connections`) - List users the logged-in user follows.
    *   `getFollowers`: (GET `/api/users/followers`) - List users following the logged-in user.
*   **Comments Model (`Comment.js`):** `trackId`, `userId`, `text`, `createdAt`. Index `trackId`.
*   **Comments Controller (`commentController.js`):** CRUD operations for comments on a track. Check track existence and potentially public status/ownership for posting/viewing. Update `commentsCount` on Track model.
*   **Comments Routes (`commentRoutes.js`):** Typically nested under tracks: `trackRouter.use('/:trackId/comments', require('./commentRoutes'))`. Use `protect`.
*   **Reactions:**
    *   **Option A (Simple):** Embed reaction counts directly in `Track.js` (`reactions: { like: Number, wow: Number }`). Create controller endpoints (e.g., POST `/api/tracks/:id/react`) to increment/decrement counts. Requires careful handling of unique users reacting.
    *   **Option B (Flexible - Separate Collection):** Model `Reaction.js` (`trackId`, `userId`, `type`). Controller endpoints add/remove reaction documents. Use aggregation to get counts when fetching tracks. More complex but tracks *who* reacted. Update `reactions` object on Track model (denormalized).
*   **Feed Controller (`feedController.js`):** (GET `/api/social/feed`) - Aggregates recent public tracks from users the logged-in user follows (`req.user.connections`). Requires querying Tracks based on the `userId` list and sorting by `startTime` or `createdAt`. Implement pagination.

---

## Phase 4: Gamification & Analytics

### Step 18: Achievements

*   **Model (`Achievement.js`):** Definition (`achievementCode`, `name`, `description`, `iconUrl`, `category`, `requirements`, `rarity`).
*   **Model (`AchievementEarned.js`):** Linking user to achievement (`userId`, `achievementId` or `achievementCode`, `earnedAt`, `trackId` (optional)). Index `userId`.
*   **Service (`achievementService.js`):** Logic to check if a user meets achievement requirements after an action (e.g., saving a track, updating stats).
    *   Call this service from relevant controllers (e.g., `trackController.saveTrack`, `userController.updateUserProfile`).
    *   If requirements met and achievement not already earned, create an `AchievementEarned` record.
*   **Controller (`achievementController.js`):**
    *   `listAchievements`: (GET `/api/achievements/definitions`) - List all available achievement definitions.
    *   `getUserAchievements`: (GET `/api/achievements/earned`) - List achievements earned by the logged-in user (populate definition details).
*   **Routes (`achievementRoutes.js`):** Map paths. Use `protect` for user-specific data.
*   **Mount Routes.**

### Step 19: Leaderboards

*   **Strategy:** Calculating leaderboards on-the-fly can be slow. Consider:
    *   **Scheduled Job:** A background task (e.g., using `node-cron` or a separate worker process) runs periodically (hourly/daily/weekly) to aggregate data from `Tracks` or `Users` and store snapshots in a `Leaderboard` collection.
    *   **Leaderboard Model (`Leaderboard.js`):** `type` (e.g., 'weekly_distance'), `period` (e.g., '2023-W42'), `scores` (array of `{ userId, username, value, rank }`).
*   **Controller (`leaderboardController.js`):** (GET `/api/leaderboards/:type`) - Fetches the latest pre-calculated leaderboard data from the `Leaderboard` collection based on type and period.
*   **Routes (`leaderboardRoutes.js`):** Map paths.
*   **Mount Routes.**

### Step 20: Challenges

*   *(Follow pattern: Define Models -> Service -> Controller -> Routes)*
*   **Model (`Challenge.js`):** Definition (`name`, `description`, `type`, `startTime`, `endTime`, `goal`, `reward`).
*   **Model (`ChallengeParticipant.js`):** User participation (`challengeId`, `userId`, `joinedAt`, `progress`, `completedAt`).
*   **Service (`challengeService.js`):** Logic to update participant progress when relevant actions occur (e.g., saving a track that contributes to a distance challenge). Check for completion.
*   **Controller (`challengeController.js`):** List active challenges, join challenge, get user's challenge progress.
*   **Routes (`challengeRoutes.js`):** Map paths.
*   **Mount Routes.**

### Step 21: Analytics API

*   **Controller (`analyticsController.js`):**
    *   `getSummaryStats`: (GET `/api/analytics/summary`) - Return `req.user.statistics`.
    *   `getTrends`: (GET `/api/analytics/trends?period=...`) - Aggregate track data over time (e.g., distance per week/month). Requires more complex MongoDB aggregation queries.
    *   `getHeatmapData`: (GET `/api/analytics/heatmap`) - Aggregate location data from user's tracks (consider privacy implications and performance). Might require sampling route points.
    *   `exportData`: (GET `/api/analytics/export`) - Generate and return user data (profile, vehicles, tracks) in a downloadable format (e.g., JSON, CSV, GPX for tracks).
*   **Routes (`analyticsRoutes.js`):** Map paths, use `protect`.
*   **Mount Routes.**

---

## Frontend Mobile Setup (React Native/Expo)

*This section outlines the initial setup for the mobile application based on Section VI of `Detailed Step Implementation.md`.*

1.  **Navigate to Apps Directory:** From the project root.
    ```bash
    cd apps
    ```
2.  **Create Expo App:** Creates the `mobile` directory and basic project structure.
    ```bash
    npx create-expo-app mobile
    ```
3.  **Navigate into Mobile Directory:**
    ```bash
    cd mobile
    ```
4.  **Install Core Dependencies:**
    *   **Navigation:** React Navigation is recommended. Choose the navigators you need (e.g., Stack, Tabs, Drawer).
        ```bash
        npm install @react-navigation/native
        npx expo install react-native-screens react-native-safe-area-context # Expo specific installation
        npm install @react-navigation/native-stack # Example: Stack navigator
        # npm install @react-navigation/bottom-tabs # Example: Bottom tabs
        ```
    *   **Firebase:** Client-side SDK for authentication and potentially other services.
        ```bash
        npm install firebase
        ```
    *   **API Client:** For making requests to your backend.
        ```bash
        npm install axios # Or use fetch API
        ```
    *   **(Optional) State Management:** Redux Toolkit, Zustand, or Context API.
        ```bash
        # npm install @reduxjs/toolkit react-redux # Example: Redux
        # npm install zustand # Example: Zustand
        ```
    *   **(Optional) Environment Variables:**
        ```bash
        npm install react-native-dotenv # For handling .env files
        ```
        Configure `babel.config.js` to use the `module:react-native-dotenv` plugin.
5.  **Configure Environment Variables:**
    *   Create a `.env` file in the `apps/mobile` directory (**add this to your root `.gitignore`**).
    *   Add Firebase web configuration keys (prefixed appropriately, e.g., `EXPO_PUBLIC_FIREBASE_API_KEY=...`). Expo handles `EXPO_PUBLIC_` prefixed variables automatically.
    *   Add the backend API URL (e.g., `EXPO_PUBLIC_API_URL=http://localhost:3001` for local dev, or your deployed Render URL).
    ```dotenv
    # apps/mobile/.env (Example)
    EXPO_PUBLIC_FIREBASE_API_KEY=AIz...
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
    EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
    EXPO_PUBLIC_FIREBASE_APP_ID=...

    # Backend API URL
    EXPO_PUBLIC_API_URL=http://localhost:3001 # Change for production
    ```
6.  **Basic Project Structure:** Create a `src` folder and organize code as planned (e.g., `src/screens`, `src/components`, `src/navigation`, `src/api`, `src/hooks`, `src/store`, `src/assets`).
7.  **Initialize Firebase:** Create a configuration file (e.g., `src/config/firebase.js`) to initialize the Firebase app using the environment variables.
8.  **Run Locally:** Start the Expo development server.
    ```bash
    npx expo start
    ```
    Use the Expo Go app on your physical device or run on an emulator/simulator (iOS/Android).

---

## Frontend Web Setup (Next.js/Vercel)

*This section outlines the initial setup for the web application based on Section VII of `Detailed Step Implementation.md`.*

1.  **Navigate to Apps Directory:** From the project root.
    ```bash
    cd apps
    ```
2.  **Create Next.js App:** Creates the `web` directory. Choose options when prompted (e.g., TypeScript, ESLint, Tailwind CSS, App Router).
    ```bash
    npx create-next-app@latest web
    ```
3.  **Navigate into Web Directory:**
    ```bash
    cd web
    ```
4.  **Install Core Dependencies:**
    *   **Firebase:** Client-side SDK.
        ```bash
        npm install firebase
        ```
    *   **API Client:**
        ```bash
        npm install axios # Or use fetch API
        ```
    *   **(Optional) State Management:**
        ```bash
        # npm install @reduxjs/toolkit react-redux # Example: Redux
        # npm install zustand # Example: Zustand
        ```
5.  **Configure Environment Variables:**
    *   Next.js uses `.env.local` for local environment variables (**`.env.local` is automatically ignored by Git**).
    *   Add Firebase web configuration keys prefixed with `NEXT_PUBLIC_`.
    *   Add the backend API URL prefixed with `NEXT_PUBLIC_`.
    ```dotenv
    # apps/web/.env.local (Example)
    NEXT_PUBLIC_FIREBASE_API_KEY=AIz...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
    NEXT_PUBLIC_FIREBASE_APP_ID=...

    # Backend API URL
    NEXT_PUBLIC_API_URL=http://localhost:3001 # Change for production deployment (e.g., Vercel env var)
    ```
6.  **Basic Project Structure:** Next.js creates a structure (e.g., `app/` or `pages/`). Organize components, hooks, API clients, etc., logically within the `src` directory if using one, or the root.
7.  **Initialize Firebase:** Create a configuration file (e.g., `src/lib/firebase/config.js`) to initialize the Firebase app using the `NEXT_PUBLIC_` environment variables.
8.  **Setup Vercel Deployment:**
    *   Create a free account at [vercel.com](https://vercel.com/).
    *   Connect your GitHub repository.
    *   Import the project.
    *   **Configure Project Settings:**
        *   **Framework Preset:** Should auto-detect Next.js.
        *   **Root Directory:** `apps/web` (Crucial for monorepo structure).
    *   **Add Environment Variables:** In the Vercel project settings under "Environment Variables":
        *   Add all the `NEXT_PUBLIC_FIREBASE_...` variables with their production values.
        *   Add `NEXT_PUBLIC_API_URL` with the **deployed** URL of your Render backend service.
        *   *Do not* prefix with `NEXT_PUBLIC_` here unless the variable *also* needs to be available server-side in Next.js API routes/server components (unlikely for these specific ones).
9.  **Run Locally:** Start the Next.js development server.
    ```bash
    npm run dev
    ```
    Access the application at `http://localhost:3000` (or the specified port).

---

## Initial Deployment & Connection Test (Full Stack)

*This section combines backend and frontend deployment tests based on Section VIII of `Detailed Step Implementation.md`.*

1.  **Commit Changes:** Add all new files and changes from backend and frontend setup.
    ```bash
    # From project root
    git add .
    git commit -m "feat: Setup initial backend, mobile, and web infrastructure"
    ```
2.  **Push to GitHub:**
    ```bash
    git push origin main # Or your primary branch
    ```
3.  **Trigger Deployments:** Pushing should automatically trigger:
    *   Backend deployment on Render (if configured).
    *   Web frontend deployment on Vercel (if configured).
4.  **Verify Deployments:**
    *   Check Render logs for successful backend build and startup.
    *   Check Vercel logs for successful web frontend build and deployment.
5.  **Basic Tests:**
    *   **Backend:** Access your deployed Render backend URL (e.g., `https://your-backend-name.onrender.com/`). You should see the welcome JSON message.
    *   **Web Frontend:** Access your deployed Vercel URL. The basic Next.js page should load.
    *   **Mobile App:** Run the mobile app locally (`npx expo start`). Ensure it builds and runs without crashing in Expo Go or simulator. (Full connection testing comes later).

After completing these steps, the basic infrastructure for backend, mobile, and web is in place. You can now proceed with implementing features phase by phase, ensuring communication between the frontend applications and the backend API.

This guide provides a detailed roadmap. Each step involves writing significant code, testing, and potentially iterating based on requirements and challenges encountered. Good luck! 