require('dotenv').config();
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const testEmail = 'indiankart2711@gmail.com'; // change to your test email
  
  const otp = crypto.randomInt(100000, 1000000).toString();
  console.log('Generated OTP:', otp);

  // Save to DB
  const result = await mongoose.connection.collection('users').updateOne(
    { email: testEmail },
    {
      $set: {
        resetOtp: await bcrypt.hash(otp, 10),
        resetOtpExpiry: new Date(Date.now() + 10 * 60000),
        resetOtpAttempts: 0,
        lastOtpRequest: new Date()
      }
    }
  );
  console.log('DB update:', result.matchedCount, 'matched,', result.modifiedCount, 'modified');

  // Send email
  try {
    const info = await transporter.sendMail({
      from: `"GraminArogya" <${process.env.SMTP_USER}>`,
      to: testEmail,
      subject: 'Test: Your GraminArogya OTP',
      html: `<div style="font-family:Arial;padding:20px;border:1px solid #e2e8f0;border-radius:8px;">
        <h2 style="color:#0b4f4c;">GraminArogya OTP Test</h2>
        <p>Your one-time password is:</p>
        <div style="background:#f8fafc;border:2px dashed #0b4f4c;padding:20px;text-align:center;border-radius:8px;margin:20px 0;">
          <span style="font-size:32px;font-weight:800;letter-spacing:10px;color:#0b4f4c;">${otp}</span>
        </div>
        <p style="color:#64748b;font-size:14px;">Valid for 10 minutes.</p>
      </div>`
    });
    console.log('Email sent! MessageId:', info.messageId);
    console.log('Now use OTP', otp, 'on the forgot page with email:', testEmail);
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
  
  process.exit(0);
}).catch(e => { console.error('DB Error:', e.message); process.exit(1); });
