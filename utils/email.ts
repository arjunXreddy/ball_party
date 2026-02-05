
import nodemailer from "nodemailer";

// Create a transporter using environment variables or defaults to Ethereal for testing
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || "test_user",
        pass: process.env.SMTP_PASS || "test_pass",
    },
});

export const sendTicketEmail = async (to: string, ticketDetails: { name: string; email: string; phoneNo: string }) => {
    try {
        const info = await transporter.sendMail({
            from: '"BallParty System" <noreply@ballparty.com>', // sender address
            to, // list of receivers
            subject: "Your Ticket Details", // Subject line
            text: `Hello ${ticketDetails.name},\n\nThank you for registering! Here are your ticket details:\n\nName: ${ticketDetails.name}\nEmail: ${ticketDetails.email}\nPhone: ${ticketDetails.phoneNo}\n\nSee you at the party!`, // plain text body
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
            <h2>Thanks for registering, ${ticketDetails.name}!</h2>
            <p>Here are your ticket details:</p>
            <ul>
                <li><strong>Name:</strong> ${ticketDetails.name}</li>
                <li><strong>Email:</strong> ${ticketDetails.email}</li>
                <li><strong>Phone:</strong> ${ticketDetails.phoneNo}</li>
            </ul>
            <p>See you at the party!</p>
        </div>
      `, // html body
        });

        console.log("Message sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        // Don't throw, just log. We don't want to fail the registration if email fails (or maybe we do, but usually not)
        return null;
    }
};
