import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load envs from default CWD .env first
dotenv.config();
// Fallback: explicitly load backend/.env relative to this file if not present
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const backendEnvPath = path.resolve(__dirname, '../../.env');
  dotenv.config({ path: backendEnvPath });
}
console.log('Cloudinary cfg:', { cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '(via URL)', api_key: process.env.CLOUDINARY_API_KEY ? `***${String(process.env.CLOUDINARY_API_KEY).slice(-4)}` : (process.env.CLOUDINARY_URL ? 'via_URL' : 'missing') });
// Configure Cloudinary using environment variables
// Prefer CLOUDINARY_URL if present (cloudinary://<key>:<secret>@<cloud_name>)
if (process.env.CLOUDINARY_URL) {
    cloudinary.config({ secure: true });
} else {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
    });
}

export default cloudinary;


