const nodemailer = require('nodemailer');

const sendOTP = (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}.`
  };

  // Return a promise
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending OTP:', error);
        reject(error); // Reject the promise on error
      } else {
        console.log('OTP sent successfully:', info.response);
        resolve(info.response); // Resolve the promise on success
      }
    });
  });
};


module.exports = { sendOTP };