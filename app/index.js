import express from 'express';
import cors from 'cors';
import session from 'express-session';
import settings from './config.js'; // Ensure this path is correct
import passport from './helpers/githubOAuth.js';
import connectDB from './database.js';

const app = express();

// 1) Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1.5) Database Connection
console.log('1) Connecting to the database...');
connectDB();

// 2) Session
app.use(
  session({
    secret: settings.SESSION_SECRET || 'gitwrite_secret',
    resave: false,
    saveUninitialized: true,
  })
);

// 3) Passport
app.use(passport.initialize());
app.use(passport.session());

// 4) Routes
console.log('2) Initializing routes...');
import githubRoutes from './routes/githubAuth.js';
app.use('/api/github', githubRoutes);
import gitOperationsRoutes from "./routes/gitOperations.js";
app.use("/api/git", gitOperationsRoutes);
import readmeGenerator from "./routes/readmeGenerator.js";
app.use("/api/ai", readmeGenerator);
import profileRoutes from "./routes/profile.js";
app.use("/api/profile", profileRoutes);
console.log('3) Routes initialized');
// 5) Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`4) Server running on port ${PORT}`));
