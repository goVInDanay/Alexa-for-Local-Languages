const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

router.post("/send-feedback", async (req, res) => {
  const { userEmail, feedback } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail", // or use your email service provider
      auth: {
        user: process.env.EMAIL_USER, // stored in environment variables
        pass: process.env.EMAIL_PASS, // stored in environment variables
      },
    });

    const mailOptions = {
      from: userEmail,
      to: process.env.EMAIL_USER, // where feedback will be sent
      subject: "User Feedback - Alexa for Local Languages",
      text: `Feedback from ${userEmail}:\n\n${feedback}`,
    };

    console.log(mailOptions);
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Feedback sent successfully" });
  } catch (error) {
    console.error("Error sending feedback email:", error);
    res.status(500).json({ message: "Failed to send feedback" });
  }
});

module.exports = router;