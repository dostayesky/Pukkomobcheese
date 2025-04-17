const Booking = require('./models/Booking');
const {sendEmail} = require('./utils/sendEmail');

exports.sendNoti = async() =>{
    const start = new Date();
    const end = start+(24 * 60 * 60 * 1000);
    // 3. Find bookings within the range
    const bookings = await Booking.find({
        returnDate: { $gt: start, $lt: end }
    }).populate('user'); // load user details from reference
  
  // 4. Send email to each renter
  for (const booking of bookings) {
    const user = booking.user;
    if (!user || !user.email) continue;
  
    const returnTimeThai = new Date(booking.returnDate.getTime() + (7 * 60 * 60 * 1000));
    const formattedTime = returnTimeThai.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
  
    await sendEmail({
      to: user.email,
      subject: '⏰ แจ้งเตือน: ใกล้ถึงเวลาคืนรถแล้ว!',
      html: `
        <p>สวัสดีคุณ ${user.name},</p>
        <p>นี่คือการแจ้งเตือนว่ารถที่คุณเช่าใกล้จะถึงเวลาคืนแล้ว:</p>
        <p><strong>กำหนดคืน: ${formattedTime}</strong></p>
        <p>กรุณาตรวจสอบให้แน่ใจว่าคุณจะคืนรถตรงเวลา ขอบคุณที่ใช้บริการ 🚗</p>
      `
    });
  
    console.log(`✅ Reminder sent to ${user.email}`);
  }
}
