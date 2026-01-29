import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL || "alaqmarak0810@gmail.com",
    pass: process.env.SMTP_PASSWORD,
  },
});

// --- Theme Constants ---
const THEME = {
  colors: {
    bg: "#f4f4f7",
    containerBg: "#ffffff",
    headerBg: "#1a202c",
    gold: "#d4af37",
    textMain: "#333333",
    textMuted: "#718096",
    border: "#e2e8f0",
  },
  fonts: {
    main: "'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    accent: "'KanzAlMarjaan', serif",
  },
};

// --- Layout Helper ---
const renderEmailLayout = (
  content: string,
  title: string,
  previewText?: string,
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @font-face {
      font-family: 'KanzAlMarjaan';
      src: url('https://db.onlinewebfonts.com/t/056353a27c68233bc7a6200e574e746f.woff2') format('woff2');
    }
    body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    
    /* Mobile-First / Responsive Styles */
    @media only screen and (max-width: 600px) {
      .main-container { width: 100% !important; max-width: 100% !important; margin: 0 !important; border-radius: 0 !important; }
      .content { padding: 20px !important; }
      .header { padding: 20px !important; }
      .info-row { display: block !important; width: 100% !important; margin-bottom: 15px !important; border-bottom: 1px solid #edf2f7; }
      .info-label { display: block !important; width: 100% !important; padding: 0 0 5px 0 !important; border: none !important; color: #718096 !important; font-size: 11px !important; letter-spacing: 0.5px !important; font-weight: 700 !important; text-transform: uppercase !important; }
      .info-value { display: block !important; width: 100% !important; padding: 0 0 10px 0 !important; border: none !important; text-align: left !important; font-size: 16px !important; color: #2d3748 !important; }
      .button-table { width: 100% !important; }
      .button-link { width: 100% !important; box-sizing: border-box !important; text-align: center !important; }
    }
  </style>
</head>
<body style="font-family: ${THEME.fonts.main}; background-color: ${THEME.colors.bg}; margin: 0; padding: 0;">
  
  <!-- Smart Preheader -->
  <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${previewText || title}
    ${"&nbsp;&zwnj;".repeat(100)}
  </div>

  <div class="wrapper" style="width: 100%; background-color: ${THEME.colors.bg}; padding: 20px 0;">
    <!-- Main Container -->
    <table class="main-container" align="center" width="600" cellpadding="0" cellspacing="0" style="background-color: ${THEME.colors.containerBg}; margin: 0 auto; max-width: 600px; width: 100%; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); font-family: ${THEME.fonts.main};">
      
      <!-- Header -->
      <tr>
        <td class="header" style="background-color: ${THEME.colors.headerBg}; padding: 30px 20px; text-align: center; border-bottom: 3px solid ${THEME.colors.gold};">
          <h1 style="color: #f6e6b4; margin: 0; font-family: ${THEME.fonts.main}; font-size: 24px; letter-spacing: 0.5px;">Jamaat Inventory</h1>
        </td>
      </tr>

      <!-- Content -->
      <tr>
        <td class="content" style="padding: 40px 30px; color: ${THEME.colors.textMain}; font-size: 16px; line-height: 1.6;">
          ${content}
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td class="footer" style="background-color: #f9fafb; padding: 25px; text-align: center; font-size: 13px; color: #888; border-top: 1px solid ${THEME.colors.border};">
          <p style="margin: 0 0 10px;">&copy; ${new Date().getFullYear()} Jamaat Inventory System</p>
          <p style="margin: 0;">Secure Automated Notification</p>
        </td>
      </tr>
      
    </table>
  </div>
</body>
</html>
`;

// --- Components ---

const renderButton = (
  label: string,
  url: string,
  variant: "primary" | "loss" = "primary",
) => {
  const bg = variant === "primary" ? THEME.colors.gold : "#e53e3e";
  const color = "#ffffff";

  return `
    <table class="button-table" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 30px; margin-bottom: 30px;">
      <tr>
        <td align="center">
          <a href="${url}" class="button-link" style="background-color: ${bg}; color: ${color}; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; mso-padding-alt: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <!--[if mso]><i style="letter-spacing: 25px; mso-font-width: -100%; mso-text-raise: 30pt">&nbsp;</i><![endif]-->
            <span style="mso-text-raise: 15pt;">${label}</span>
            <!--[if mso]><i style="letter-spacing: 25px; mso-font-width: -100%">&nbsp;</i><![endif]-->
          </a>
        </td>
      </tr>
    </table>
  `;
};

const renderInfoTable = (
  rows: { label: string; value: string; color?: string }[],
) => {
  const rowsHtml = rows
    .map(
      (row) => `
    <tr class="info-row">
      <td class="info-label" style="padding: 12px 15px; border-bottom: 1px solid #edf2f7; font-size: 13px; font-weight: 600; color: ${THEME.colors.textMuted}; text-transform: uppercase; width: 35%; vertical-align: top;">
        ${row.label}
      </td>
      <td class="info-value" style="padding: 12px 15px; border-bottom: 1px solid #edf2f7; font-size: 15px; font-weight: 600; color: ${row.color || "#2d3748"}; text-align: right; vertical-align: top;">
        ${row.value}
      </td>
    </tr>
  `,
    )
    .join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid ${THEME.colors.border}; border-radius: 8px; margin-bottom: 25px; border-collapse: separate; border-spacing: 0;">
      ${rowsHtml}
    </table>
  `;
};

// --- Templates ---

export const otpTemplate = (data: { otp: string; userName: string }) => {
  const content = `
    <div style="font-size: 20px; font-weight: 700; color: ${THEME.colors.headerBg}; margin-bottom: 15px;">Password Reset OTP</div>
    <div style="margin-bottom: 20px;">
      Hello <strong>${data.userName}</strong>,
      <br><br>
      You requested a password reset. Use the One-Time Password (OTP) below to verify your identity.
    </div>
    
    <div style="text-align: center; margin: 35px 0;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: ${THEME.colors.gold}; background: #ffffff; padding: 15px 30px; border: 2px dashed ${THEME.colors.gold}; border-radius: 8px; display: inline-block;">
        ${data.otp}
      </span>
    </div>

    <div style="font-size: 13px; color: #718096; text-align: center;">
      This code is valid for <strong>10 minutes</strong>.<br>
      If you did not request this, please ignore this email.
    </div>
  `;
  return renderEmailLayout(
    content,
    "OTP Verification",
    `Your verification code is ${data.otp}`,
  );
};

export const newEventTemplate = (data: {
  name: string;
  mobile: string;
  occasionDate: string;
  occasionTime: string;
  hall: string | string[];
  thaalCount: number;
}) => {
  const dateStr = new Date(data.occasionDate).toDateString();
  const hallStr = Array.isArray(data.hall) ? data.hall.join(", ") : data.hall;

  const content = `
    <div style="font-size: 20px; font-weight: 700; color: ${THEME.colors.headerBg}; margin-bottom: 15px;">New Event Booking</div>
    <div style="margin-bottom: 25px;">
      A new event has been booked by <strong style="color: ${THEME.colors.gold};">${data.name}</strong>.
    </div>

    ${renderInfoTable([
      { label: "Booker Name", value: data.name },
      { label: "Mobile", value: data.mobile },
      { label: "Date", value: dateStr },
      { label: "Time", value: data.occasionTime },
      { label: "Hall(s)", value: hallStr },
      { label: "Thaal Count", value: data.thaalCount.toString() },
    ])}

    ${renderButton("View All Events", `${process.env.NEXT_PUBLIC_APP_URL}/events`)}
  `;
  return renderEmailLayout(
    content,
    `New Booking: ${data.name}`,
    `New Event: ${data.name} on ${dateStr} - ${data.thaalCount} Thaals`,
  );
};

export const inventoryUpdateTemplate = (data: {
  userName: string;
  itemName: string;
  quantity: number;
  action: string;
  eventId: string;
  newBalance: number;
}) => {
  const isIssue = data.action === "ISSUE";
  const actionColor = isIssue ? "#e53e3e" : "#10b981";
  const actionText = data.action.toLowerCase() + "d";

  const content = `
    <div style="font-size: 20px; font-weight: 700; color: ${THEME.colors.headerBg}; margin-bottom: 15px;">Inventory Update</div>
    <div style="margin-bottom: 25px;">
      User <strong>${data.userName}</strong> has 
      <span style="color: ${actionColor}; font-weight: bold;">${actionText}</span> items.
    </div>

    ${renderInfoTable([
      { label: "Item", value: data.itemName },
      { label: "Action", value: data.action, color: actionColor },
      { label: "Quantity", value: Math.abs(data.quantity).toString() },
      { label: "New Balance", value: data.newBalance.toString() },
      { label: "Event ID", value: data.eventId },
    ])}

    ${renderButton("View Transaction Log", `${process.env.NEXT_PUBLIC_APP_URL}/logs/ledger`)}
  `;
  return renderEmailLayout(
    content,
    "Inventory Alert",
    `${data.userName} ${actionText} ${Math.abs(data.quantity)}x ${data.itemName}`,
  );
};

export const newItemTemplate = (data: {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  userName: string;
}) => {
  const content = `
    <div style="font-size: 20px; font-weight: 700; color: ${THEME.colors.headerBg}; margin-bottom: 15px;">New Item Added</div>
    <div style="margin-bottom: 25px;">
      <strong>${data.userName}</strong> has registered a new item in the inventory.
    </div>

    ${renderInfoTable([
      { label: "Item Name", value: data.name },
      { label: "Category", value: data.category },
      { label: "Initial Stock", value: `${data.quantity} ${data.unit}` },
    ])}

    ${renderButton("Check Inventory", `${process.env.NEXT_PUBLIC_APP_URL}/inventory`)}
  `;
  return renderEmailLayout(
    content,
    "New Inventory Item",
    `New Item: ${data.name} added by ${data.userName}`,
  );
};

export const newUserTemplate = (data: {
  username: string;
  role: string;
  email: string;
}) => {
  const content = `
    <div style="font-size: 20px; font-weight: 700; color: ${THEME.colors.headerBg}; margin-bottom: 15px;">New User Registration</div>
    <div style="margin-bottom: 25px;">
      A new user has been successfully registered.
    </div>

    ${renderInfoTable([
      { label: "Username", value: data.username },
      { label: "Email Address", value: data.email },
      { label: "Assigned Role", value: data.role, color: "#d4af37" },
    ])}

    ${renderButton("Manage Users", `${process.env.NEXT_PUBLIC_APP_URL}/settings/users`)}
  `;
  return renderEmailLayout(
    content,
    "New User Alert",
    `Welcome, ${data.username}!`,
  );
};

export const errorTemplate = (data: {
  source: string;
  error: string;
  context?: string;
}) => {
  const content = `
    <div style="font-size: 20px; font-weight: 700; color: #e53e3e; margin-bottom: 15px;">System Error Alert</div>
    <div style="margin-bottom: 20px;">
      An error occurred in <strong>${data.source}</strong>.
    </div>

    <div style="background-color: #fff5f5; border-left: 4px solid #e53e3e; padding: 15px; margin-bottom: 25px; font-family: 'Consolas', 'Monaco', monospace; font-size: 13px; color: #c53030; overflow-x: auto;">
      ${data.error}
    </div>

    ${
      data.context
        ? `
      <div style="margin-bottom: 15px;">
        <strong style="color: #718096; text-transform: uppercase; font-size: 12px;">Context</strong><br>
        ${data.context}
      </div>
    `
        : ""
    }

    ${renderButton("View Error Logs", `${process.env.NEXT_PUBLIC_APP_URL}/logs`, "loss")}
  `;
  return renderEmailLayout(
    content,
    `Error: ${data.source}`,
    `ALERT: Error in ${data.source}`,
  );
};

// --- Sender ---
interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer | string }[];
  icalEvent?: { filename?: string; method?: string; content: any }; // Support for ICS
}

export async function sendEmail({
  to,
  subject,
  html,
  attachments,
  icalEvent,
}: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"Jamaat Inventory" <${
        process.env.SMTP_EMAIL || "alaqmarak0810@gmail.com"
      }>`,
      to: Array.isArray(to) ? to.join(",") : to,
      subject,
      html, // HTML is already fully rendered by the templates now
      attachments,
      icalEvent,
    });
    console.log("Email sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

// --- Utilities ---
export const generateICS = (event: {
  uid: string;
  start: Date;
  end?: Date;
  summary: string;
  description: string;
  location: string;
}) => {
  const formatDate = (date: Date) =>
    date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const now = formatDate(new Date());

  // Default duration 2 hours if no end time
  const start = new Date(event.start);
  const end = event.end
    ? new Date(event.end)
    : new Date(start.getTime() + 2 * 60 * 60 * 1000);

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Jamaat Inventory//NONSGML Event//EN
METHOD:REQUEST
BEGIN:VEVENT
UID:${event.uid}
DTSTAMP:${now}
DTSTART:${formatDate(start)}
DTEND:${formatDate(end)}
SUMMARY:${event.summary}
DESCRIPTION:${event.description}
LOCATION:${event.location}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`.replace(/\n/g, "\r\n");
};
