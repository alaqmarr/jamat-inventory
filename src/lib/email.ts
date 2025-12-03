import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL || "alaqmarak0810@gmail.com",
    pass: process.env.SMTP_PASSWORD,
  },
});

// Styles from user request
const emailStyles = `
  <style>
    @font-face {
      font-family: 'KanzAlMarjaan';
      src: url('https://db.onlinewebfonts.com/t/056353a27c68233bc7a6200e574e746f.woff2') format('woff2');
    }
    body { font-family: 'Segoe UI', sans-serif; background-color: #f4f4f7; color: #333; }
    .wrapper { width: 100%; background-color: #f4f4f7; padding-bottom: 40px; }
    .main-container { background-color: #ffffff; margin: 0 auto; max-width: 600px; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { background: #1a202c; padding: 30px 20px; text-align: center; border-bottom: 3px solid #d4af37; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 20px; font-weight: 700; color: #1a202c; margin-bottom: 15px; }
    .message { font-size: 15px; color: #555; margin-bottom: 25px; }
    .info-table { width: 100%; background-color: #f9fafb; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 25px; }
    .info-row td { padding: 12px 15px; border-bottom: 1px solid #edf2f7; }
    .info-label { font-size: 12px; font-weight: 600; color: #718096; text-transform: uppercase; width: 35%; }
    .info-value { font-size: 14px; font-weight: 600; color: #2d3748; text-align: right; }
    .footer { background-color: #f9fafb; padding: 25px; text-align: center; font-size: 12px; color: #888; }
  </style>
`;

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer | string }[];
}

export async function sendEmail({
  to,
  subject,
  html,
  attachments,
}: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"Jamaat Inventory" <${
        process.env.SMTP_EMAIL || "alaqmarak0810@gmail.com"
      }>`,
      to: Array.isArray(to) ? to.join(",") : to,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          ${emailStyles}
        </head>
        <body>
          <div class="wrapper">
            <div class="main-container">
              <div class="header">
                <h1 style="color: #f6e6b4; margin: 0;">Jamaat Inventory</h1>
              </div>
              <div class="content">
                ${html}
              </div>
              <div class="footer">
                &copy; ${new Date().getFullYear()} Jamaat Inventory System
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments,
    });
    console.log("Email sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

export const inventoryUpdateTemplate = (data: {
  userName: string;
  itemName: string;
  quantity: number;
  action: string;
  eventId: string;
  newBalance: number;
}) => {
  const color = data.action === "ISSUE" ? "#e53e3e" : "#10b981";
  return `
    <div class="greeting">Inventory Update</div>
    <div class="message">
      User <strong>${
        data.userName
      }</strong> has ${data.action.toLowerCase()}d items.
    </div>
    <table class="info-table">
      <tr class="info-row"><td class="info-label">Item</td><td class="info-value">${
        data.itemName
      }</td></tr>
      <tr class="info-row"><td class="info-label">Action</td><td class="info-value" style="color: ${color}">${
    data.action
  }</td></tr>
      <tr class="info-row"><td class="info-label">Quantity</td><td class="info-value">${
        data.quantity
      }</td></tr>
      <tr class="info-row"><td class="info-label">New Balance</td><td class="info-value">${
        data.newBalance
      }</td></tr>
      <tr class="info-row"><td class="info-label">Event ID</td><td class="info-value">${
        data.eventId
      }</td></tr>
    </table>
  `;
};

export const newEventTemplate = (data: {
  name: string;
  mobile: string;
  occasionDate: string;
  occasionTime: string;
  hall: string | string[];
  thaalCount: number;
}) => {
  return `
    <div class="greeting">New Event Booking</div>
    <div class="message">
      A new event has been booked by <strong>${data.name}</strong>.
    </div>
    <table class="info-table">
      <tr class="info-row"><td class="info-label">Booker</td><td class="info-value">${
        data.name
      }</td></tr>
      <tr class="info-row"><td class="info-label">Mobile</td><td class="info-value">${
        data.mobile
      }</td></tr>
      <tr class="info-row"><td class="info-label">Date</td><td class="info-value">${new Date(
        data.occasionDate
      ).toDateString()}</td></tr>
      <tr class="info-row"><td class="info-label">Time</td><td class="info-value">${
        data.occasionTime
      }</td></tr>
      <tr class="info-row"><td class="info-label">Hall</td><td class="info-value">${
        Array.isArray(data.hall) ? data.hall.join(", ") : data.hall
      }</td></tr>
      <tr class="info-row"><td class="info-label">Thaal Count</td><td class="info-value">${
        data.thaalCount
      }</td></tr>
    </table>
    <div style="text-align: center; margin-top: 20px;">
      <a href="${
        process.env.NEXT_PUBLIC_APP_URL
      }/events" style="background-color: #d4af37; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View All Events</a>
    </div>
  `;
};

export const newItemTemplate = (data: {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  userName: string;
}) => {
  return `
    <div class="greeting">New Inventory Item</div>
    <div class="message">
      A new item has been added to the inventory by <strong>${data.userName}</strong>.
    </div>
    <table class="info-table">
      <tr class="info-row"><td class="info-label">Item Name</td><td class="info-value">${data.name}</td></tr>
      <tr class="info-row"><td class="info-label">Category</td><td class="info-value">${data.category}</td></tr>
      <tr class="info-row"><td class="info-label">Quantity</td><td class="info-value">${data.quantity} ${data.unit}</td></tr>
    </table>
    <div style="text-align: center; margin-top: 20px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/inventory" style="background-color: #d4af37; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Inventory</a>
    </div>
  `;
};

export const newUserTemplate = (data: {
  username: string;
  role: string;
  email: string;
}) => {
  return `
    <div class="greeting">New User Registered</div>
    <div class="message">
      A new user has been registered in the system.
    </div>
    <table class="info-table">
      <tr class="info-row"><td class="info-label">Username</td><td class="info-value">${data.username}</td></tr>
      <tr class="info-row"><td class="info-label">Email</td><td class="info-value">${data.email}</td></tr>
      <tr class="info-row"><td class="info-label">Role</td><td class="info-value">${data.role}</td></tr>
    </table>
    <div style="text-align: center; margin-top: 20px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/users" style="background-color: #d4af37; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Manage Users</a>
    </div>
  `;
};

export const errorTemplate = (data: {
  source: string;
  error: string;
  context?: string;
}) => {
  return `
    <div class="greeting" style="color: #e53e3e;">System Error Alert</div>
    <div class="message">
      An error occurred in <strong>${data.source}</strong>.
    </div>
    <div style="background-color: #fff5f5; border-left: 4px solid #e53e3e; padding: 15px; margin-bottom: 20px; font-family: monospace; color: #c53030;">
      ${data.error}
    </div>
    ${
      data.context
        ? `<div class="message"><strong>Context:</strong> ${data.context}</div>`
        : ""
    }
  `;
};

export const otpTemplate = (data: { otp: string; userName: string }) => {
  return `
    <div class="greeting">Password Reset OTP</div>
    <div class="message">
      Hello <strong>${data.userName}</strong>,
    </div>
    <div class="message">
      Your One-Time Password (OTP) for password change is:
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #d4af37; background: #fff; padding: 10px 20px; border: 2px dashed #d4af37; border-radius: 8px;">${data.otp}</span>
    </div>
    <div class="message">
      This OTP is valid for 10 minutes. Do not share this code with anyone.
    </div>
  `;
};
