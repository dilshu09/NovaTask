// Vercel Serverless Function entry point
// This wraps the Express backend app so Vercel can serve it as a serverless function.
import app from '../backend/server.js';

export default app;
