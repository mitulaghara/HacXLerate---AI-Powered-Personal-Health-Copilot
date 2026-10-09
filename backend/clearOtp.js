require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const result = await mongoose.connection.collection('users').updateMany(
    {},
    { $unset: { lastOtpRequest: '', resetOtp: '', resetOtpExpiry: '', resetOtpAttempts: '' } }
  );
  console.log('OTP cooldown cleared for', result.modifiedCount, 'users.');
  console.log('You can now request a fresh OTP on the forgot pages.');
  process.exit(0);
}).catch(e => { console.error('DB Error:', e.message); process.exit(1); });
