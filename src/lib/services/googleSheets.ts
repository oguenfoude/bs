/**
 * Google Sheets Service
 * 
 * ENVIRONMENT VARIABLES:
 * - GOOGLE_SHEET_ID: The ID of the target Google Sheet
 * - GOOGLE_SERVICE_ACCOUNT_EMAIL: Service account email
 * - GOOGLE_PRIVATE_KEY: Private key from service account JSON
 * - BASE_URL: Base URL for images (optional, uses Vercel URL if available)
 */

import { google, type sheets_v4 } from 'googleapis';
import type { OrderInput } from '../types';
import { withRetry } from '../utils';
import { getWatchImageUrl } from '../utils/url';

const HEADER_ROW = [
  'Order ID',
  'Date',
  'Image Preview',
  'Name',
  'Phone',
  'Wilaya',
  'Baladiya',
  'Watch Model',
  'Model Number',
  'Quantity',
  'Delivery Type',
  'Total Price',
  'Status',
];

/**
 * Authenticates with Google Sheets API.
 */
function getGoogleAuth() {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!serviceAccountEmail || !privateKey) {
    throw new Error(
      'Missing Google Service Account credentials. ' +
      'Check GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY environment variables.'
    );
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: serviceAccountEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

/**
 * Gets Google Sheets API client.
 */
async function getSheetsClient(): Promise<sheets_v4.Sheets> {
  const auth = getGoogleAuth();
  return google.sheets({ version: 'v4', auth });
}

/**
 * Gets the first sheet name from the spreadsheet.
 */
async function getFirstSheetName(sheets: sheets_v4.Sheets, sheetId: string): Promise<string> {
  try {
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });
    
    const sheet = spreadsheet.data.sheets?.[0];
    if (!sheet || !sheet.properties?.title) {
      throw new Error('No sheets found in the spreadsheet');
    }
    
    return sheet.properties.title;
  } catch (error) {
    console.error('❌ Error getting sheet name:', error);
    // Fallback to Sheet1 if we can't get the name
    return 'Sheet1';
  }
}

/**
 * Checks if sheet has data (any rows).
 */
async function hasData(sheets: sheets_v4.Sheets, sheetId: string, sheetName: string): Promise<boolean> {
  try {
    const range = `${sheetName}!A1:Z1`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    const rows = response.data.values || [];
    return rows.length > 0;
  } catch {
    return false;
  }
}

/**
 * Creates header row in sheet if it doesn't exist.
 */
async function createHeadersIfNeeded(sheets: sheets_v4.Sheets, sheetId: string, sheetName: string): Promise<void> {
  try {
    // Check if sheet has any data
    const hasExistingData = await hasData(sheets, sheetId, sheetName);
    
    if (hasExistingData) {
      console.log('✅ Sheet already has data, skipping header creation');
      return;
    }

    // Sheet is empty, create headers
    const range = `${sheetName}!A1:M1`;
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [HEADER_ROW],
      },
    });

    console.log('✅ Sheet headers created successfully');
  } catch (error) {
    // If header creation fails, just log and continue
    // The append will still work if headers exist
    console.warn('⚠️ Could not create headers (sheet may already have headers):', error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Formats order data into sheet row array.
 * Includes IMAGE formula for product preview.
 */
function formatOrderRow(orderData: OrderInput): (string | number)[] {
  const deliveryText = orderData.deliveryOption === 'home' ? 'منزل' : 'مكتب';
  const timestamp = new Date().toISOString();
  
  // Create IMAGE formula for Google Sheets
  const imageUrl = getWatchImageUrl(orderData.watchModelId);
  const imageFormula = `=IMAGE("${imageUrl}")`;
  
  return [
    orderData.clientRequestId,        // Column A: Order ID
    timestamp,                         // Column B: Date
    imageFormula,                      // Column C: Image Preview (formula)
    orderData.fullName,                // Column D: Name
    orderData.phone,                   // Column E: Phone
    orderData.wilayaNameAr,            // Column F: Wilaya
    orderData.baladiyaNameAr,          // Column G: Baladiya
    `موديل ${orderData.watchModelId}`, // Column H: Watch Model
    orderData.modelNumber || '',        // Column I: Model Number (user input)
    orderData.quantity || 1,           // Column J: Quantity
    deliveryText,                      // Column K: Delivery Type
    orderData.totalPrice,              // Column L: Total Price
    'New',                             // Column M: Status
  ];
}

/**
 * Saves order to Google Sheets with retry logic.
 */
export async function saveOrder(
  orderData: OrderInput
): Promise<{ success: boolean; rowNumber?: number; error?: string }> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    return {
      success: false,
      error: 'GOOGLE_SHEET_ID environment variable is not set',
    };
  }

  // Check if Sheets integration is enabled
  if (process.env.SHEETS_ENABLED === 'false') {
    console.log('⚠️ Google Sheets integration is disabled');
    return { success: true }; // Return success but don't actually save
  }

  try {
    const result = await withRetry(async () => {
      const sheets = await getSheetsClient();

      // Get the actual sheet name (first sheet in the spreadsheet)
      const sheetName = await getFirstSheetName(sheets, sheetId);
      console.log(`📋 Using sheet: "${sheetName}"`);

      // Try to create headers if sheet is empty (non-blocking)
      await createHeadersIfNeeded(sheets, sheetId, sheetName);

      // Format and append order
      const rowValues = formatOrderRow(orderData);
      const range = `${sheetName}!A:K`;

      const response = await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [rowValues],
        },
      });

      const updatedRange = response.data.updates?.updatedRange;
      const rowNumber = updatedRange 
        ? parseInt(updatedRange.match(/\d+$/)?.[0] || '0') 
        : undefined;

      return { success: true, rowNumber };
    }, 3); // 3 retries

    console.log('✅ Order saved to Google Sheets. Row:', result.rowNumber);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error saving order to Google Sheets:', errorMessage);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Checks for duplicate orders.
 */
export async function checkDuplicateOrder(clientRequestId: string): Promise<boolean> {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!sheetId) return false;

    // Skip duplicate check if Sheets is disabled
    if (process.env.SHEETS_ENABLED === 'false') {
      return false;
    }

    const sheets = await getSheetsClient();
    const sheetName = await getFirstSheetName(sheets, sheetId);
    const range = `${sheetName}!A2:A`;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    const rows = response.data.values || [];
    const orderIds = rows.flat().map((id: string) => String(id).trim());

    return orderIds.includes(clientRequestId);
  } catch {
    return false; // Fail open
  }
}
