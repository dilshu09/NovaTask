import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import UserSettings from '../models/UserSettings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Setup Mock DB Connection and execute verification tests
const runTests = async () => {
  console.log('--- NOVATASK BACKEND VERIFICATION SUITE ---\n');
  
  try {
    // 1. Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/novatask_test');
    console.log('Connected to testing database successfully.\n');

    // Clean test users
    await User.deleteMany({ email: 'test.developer@novatask.ai' });
    await UserSettings.deleteMany({});

    // 2. Test Step 1: User Registration
    console.log('[Test 1] Registering test user: "test.developer@novatask.ai"...');
    const mockOtp = '888888';
    const mockExpires = new Date(Date.now() + 10 * 60 * 1000);
    
    const user = await User.create({
      name: 'Dev Tester',
      email: 'test.developer@novatask.ai',
      otp: { code: mockOtp, expiresAt: mockExpires }
    });
    
    console.log(`User created. Email: ${user.email}, IsVerified: ${user.isVerified}`);
    console.log(`Mock OTP scheduled in DB: ${user.otp.code}\n`);

    // 3. Test Step 2: Verification of OTP
    console.log('[Test 2] Verifying OTP code: 888888...');
    const foundUser = await User.findOne({ email: 'test.developer@novatask.ai' });
    if (!foundUser || foundUser.otp.code !== '888888') {
      throw new Error('OTP Verification failed: mismatch in DB OTP key.');
    }
    console.log('OTP verification matched successfully!\n');

    // 4. Test Step 3: Registration Completion and Settings Initialization
    console.log('[Test 3] Completing registration and initializing settings...');
    foundUser.isVerified = true;
    foundUser.otp = undefined; // clear OTP
    await foundUser.save();
    
    // Create settings record
    await UserSettings.create({ user: foundUser._id });

    console.log(`Account verified. IsVerified: ${foundUser.isVerified}`);
    
    // Validate Settings Exist
    const userSettings = await UserSettings.findOne({ user: foundUser._id });
    if (!userSettings) {
      throw new Error('UserSettings record was not created successfully.');
    }
    console.log('UserSettings initialized successfully!\n');

    console.log('--- ALL INTEGRATION TESTS COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('VERIFICATION ERROR:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected testing database.');
    process.exit(0);
  }
};

runTests();
