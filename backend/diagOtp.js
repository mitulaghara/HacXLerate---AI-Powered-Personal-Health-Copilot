require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const users = await mongoose.connection.collection('users').find(
    {},
    { projection: { email: 1, role: 1, lastOtpRequest: 1, phone: 1 } }
  ).toArray();
  
  const withEmail = users.filter(u => u.email && u.email.includes('@'));
  console.log('Users with email address:', withEmail.length);
  withEmail.forEach(u => {
    console.log(` - ${u.email} | role: ${u.role} | lastOtpRequest: ${u.lastOtpRequest || 'none'}`);
  });
  
  const withCooldown = withEmail.filter(u => u.lastOtpRequest && (Date.now() - new Date(u.lastOtpRequest).getTime()) < 60000);
  if (withCooldown.length) {
    console.log('\nUsers still on 1-min cooldown:', withCooldown.map(u => u.email));
  } else {
    console.log('\nNo users on cooldown. Cooldown is clear for all.');
  }
  process.exit(0);
}).catch(e => { console.error('DB Error:', e.message); process.exit(1); });
