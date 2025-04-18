const Booking = require('../models/Booking');
const {sendEmail} = require('./sendEmail.js');

exports.sendNoti = async() =>{
    //console.log("checking");
    const start = new Date();
    const end = new Date(start.getTime()+(24 * 60 * 60 * 1000));
    // Find bookings within the range
    const bookings = await Booking.find({
        returnDate: { $gt: start, $lt: end }
    }).populate('user','name email').populate('provider','name tel'); // load user details from reference
  //console.log(bookings);
  // Send email to each renter
  for (const booking of bookings) {
    const user = booking.user;
    const provider = booking.provider;
    //console.log(user);
    if (!user || !user.email) continue;
  
    const returnTimeThai = new Date(booking.returnDate.getTime());
    const formattedTime = returnTimeThai.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
    try{
        await sendEmail({
            to: booking.user.email,
            subject: '⏰ Reminder: Your car return time is near! 🚙💨',
            html: `
              <p>Hello <strong>${user.name || 'User'}</strong>,</p>
              <p>This is a friendly reminder that your rented car is due to be returned soon</p>
              <ul style="line-height: 1.6;">
                  <li><strong>📅 Return Due:</strong> ${formattedTime}</li>
                  <li><strong>🚙 Provider:</strong> ${provider.name}</li>
              </ul>
              <p>🚨 Please make sure to return the car on time.</p>
              <p>If you need assistance, feel free to reach out to ${provider.name}'s team at <strong>${provider.tel}</strong> 📞</p>
              <p>Have a great day! 🌞</p>
            `
          });
        console.log(`✅ Reminder sent to ${user.email}`);
    }catch(err){
        console.error(`❌ Error sending email to ${user.email}`, err);
    }
    
  }
}
