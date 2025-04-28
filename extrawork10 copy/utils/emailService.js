require("dotenv").config();
const nodemailer = require("nodemailer");
const Newsletter = require("../models/Newsletter"); // Adjust path if needed

// Create transporter using Mailtrap SMTP
const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: process.env.MAILTRAP_PORT,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

// Function to send emails to all subscribers
async function sendNewsletterEmails(pet) {
  try {
    const subscribers = await Newsletter.find({});

    if (subscribers.length === 0) {
      console.log("No subscribers found.");
      return;
    }

    const emailList = subscribers.map((sub) => sub.email); // Extract emails

    const mailOptions = {
      from: "no-reply@fureverhome.com",
      to: emailList.join(","),
      subject: `New Pet Available: ${pet.name}! 🐾`,
      text: `Hey there!\n\nA new pet has been added:\n\nName: ${pet.name}\nType: ${pet.type}\nDescription: ${pet.description}\n\nVisit FurEverHome to learn more!`,
    };

    await transporter.sendMail(mailOptions);
    console.log(
      `Emails sent successfully to ${subscribers.length} subscribers.`
    );
  } catch (error) {
    console.error("Error sending newsletter emails:", error);
  }
}

module.exports = { sendNewsletterEmails };
