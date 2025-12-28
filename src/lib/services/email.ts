/**
 * Email Service
 * 
 * PURPOSE: Sends order notification emails to admin via SMTP.
 * Supports multiple recipients for order notifications.
 * 
 * ENVIRONMENT VARIABLES:
 * - SMTP_FROM_EMAIL: Email address to send from (Gmail)
 * - SMTP_PASSWORD: Gmail App Password
 * - ORDER_NOTIFICATION_EMAIL: Primary recipient (can be comma-separated for multiple)
 * - SMTP_HOST: SMTP server (defaults to Gmail)
 * - SMTP_PORT: SMTP port (defaults to 587)
 */

import nodemailer from 'nodemailer';
import type { OrderInput } from '../types';
import { withRetry } from '../utils';
import { getWatchImageUrl } from '../utils/url';

/**
 * Creates SMTP transporter using Gmail configuration.
 */
function createTransporter() {
  // Use provided SMTP config or default to Gmail
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUser = process.env.SMTP_FROM_EMAIL;
  const smtpPass = process.env.SMTP_PASSWORD;

  if (!smtpUser || !smtpPass) {
    throw new Error(
      'Missing SMTP configuration. ' +
      'Check SMTP_FROM_EMAIL and SMTP_PASSWORD environment variables.'
    );
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

/**
 * Verifies SMTP connection.
 */
async function verifyConnection(transporter: nodemailer.Transporter): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified');
    return true;
  } catch (error) {
    console.error('❌ SMTP verification failed:', error);
    return false;
  }
}

/**
 * Formats order data into HTML email template with product image.
 */
function formatOrderEmailHTML(orderData: OrderInput): string {
  const deliveryText = orderData.deliveryOption === 'home' ? 'منزل (+800 دج)' : 'مكتب (+500 دج)';
  const deliveryCost = orderData.deliveryOption === 'home' ? 800 : 500;
  const basePrice = 1600;
  const imageUrl = getWatchImageUrl(orderData.watchModelId);

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>طلب جديد - BS MONTERS</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 10px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #dc2626 0%, #e11d48 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .product-image {
      text-align: center;
      margin: 20px 0;
    }
    .product-image img {
      max-width: 300px;
      height: auto;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px;
      text-align: right;
      border-bottom: 1px solid #e5e5e5;
    }
    th {
      background-color: #f9fafb;
      font-weight: bold;
      color: #1f2937;
    }
    .highlight {
      background-color: #fef2f2;
      font-weight: bold;
      color: #dc2626;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e5e5e5;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛍️ طلب جديد - BS MONTERS</h1>
    </div>
    
    <div class="product-image">
      <img src="${imageUrl}" alt="موديل ${orderData.watchModelId}" />
    </div>
    
    <table>
      <tr>
        <th>المعلومات</th>
        <th>التفاصيل</th>
      </tr>
      <tr>
        <td>رقم الطلب</td>
        <td class="highlight">${orderData.clientRequestId}</td>
      </tr>
      <tr>
        <td>الاسم الكامل</td>
        <td>${orderData.fullName}</td>
      </tr>
      <tr>
        <td>رقم الهاتف</td>
        <td><a href="tel:${orderData.phone}">${orderData.phone}</a></td>
      </tr>
      <tr>
        <td>الولاية</td>
        <td>${orderData.wilayaNameAr}</td>
      </tr>
      <tr>
        <td>البلدية</td>
        <td>${orderData.baladiyaNameAr}</td>
      </tr>
      <tr>
        <td>موديل الساعة</td>
        <td>موديل ${orderData.watchModelId}</td>
      </tr>
      ${orderData.modelNumber ? `
      <tr>
        <td>رقم النموذج المدخل</td>
        <td>${orderData.modelNumber}</td>
      </tr>
      ` : ''}
      <tr>
        <td>الكمية</td>
        <td>${orderData.quantity || 1}</td>
      </tr>
      <tr>
        <td>طريقة التوصيل</td>
        <td>${deliveryText}</td>
      </tr>
      <tr>
        <td>سعر المنتج</td>
        <td>${basePrice.toLocaleString('ar-DZ')} دج × ${orderData.quantity || 1}</td>
      </tr>
      <tr>
        <td>تكلفة التوصيل</td>
        <td>${deliveryCost.toLocaleString('ar-DZ')} دج</td>
      </tr>
      <tr class="highlight">
        <td>الإجمالي</td>
        <td>${orderData.totalPrice.toLocaleString('ar-DZ')} دج</td>
      </tr>
      <tr>
        <td>وقت الطلب</td>
        <td>${new Date().toLocaleString('ar-DZ', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        })}</td>
      </tr>
    </table>
    
    <div class="footer">
      <p>تم استلام هذا الطلب تلقائياً من موقع BS MONTERS</p>
      <p>يرجى الاتصال بالعميل لتأكيد الطلب</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Gets recipient email addresses.
 * Supports multiple recipients (comma-separated).
 */
function getRecipients(): string[] {
  const notificationEmail = process.env.ORDER_NOTIFICATION_EMAIL;
  
  if (!notificationEmail) {
    // Fallback to SMTP_FROM_EMAIL if ORDER_NOTIFICATION_EMAIL not set
    const fromEmail = process.env.SMTP_FROM_EMAIL;
    if (fromEmail) {
      return [fromEmail];
    }
    throw new Error('No recipient email specified. Set ORDER_NOTIFICATION_EMAIL or SMTP_FROM_EMAIL');
  }

  // Split by comma and trim each email
  return notificationEmail
    .split(',')
    .map(email => email.trim())
    .filter(email => email.length > 0);
}

/**
 * Sends order notification email with retry logic.
 * Supports multiple recipients.
 */
export async function sendOrderEmail(
  orderData: OrderInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await withRetry(async () => {
      const transporter = createTransporter();

      // Verify connection first
      const isVerified = await verifyConnection(transporter);
      if (!isVerified) {
        throw new Error('SMTP connection verification failed');
      }

      // Get recipients (supports multiple)
      const recipients = getRecipients();
      const fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@bsmonters.com';

      // Format email
      const htmlContent = formatOrderEmailHTML(orderData);

      // Send email to all recipients
      const info = await transporter.sendMail({
        from: `"BS MONTERS" <${fromEmail}>`,
        to: recipients.join(', '), // Multiple recipients
        subject: `طلب جديد - ${orderData.fullName} - موديل ${orderData.watchModelId}`,
        html: htmlContent,
        text: `
طلب جديد - BS MONTERS

رقم الطلب: ${orderData.clientRequestId}
الاسم: ${orderData.fullName}
الهاتف: ${orderData.phone}
الولاية: ${orderData.wilayaNameAr}
البلدية: ${orderData.baladiyaNameAr}
موديل الساعة: ${orderData.watchModelId}
طريقة التوصيل: ${orderData.deliveryOption === 'home' ? 'منزل (+800 دج)' : 'مكتب (+500 دج)'}
الإجمالي: ${orderData.totalPrice.toLocaleString('ar-DZ')} دج
صورة المنتج: ${getWatchImageUrl(orderData.watchModelId)}
        `.trim(),
      });

      console.log(`✅ Order email sent to ${recipients.length} recipient(s). Message ID:`, info.messageId);
      console.log(`📧 Image URL in email: ${getWatchImageUrl(orderData.watchModelId)}`);
      return { success: true };
    }, 3); // 3 retries

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error sending order email:', errorMessage);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}
