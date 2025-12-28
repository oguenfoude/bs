/**
 * API Route: Submit Order
 * 
 * PURPOSE: Handles order submission with strict validation, retry logic, and parallel processing.
 * 
 * WORKFLOW:
 * 1. Validate request body using Zod schema
 * 2. Check for duplicate orders
 * 3. Execute Google Sheets save and Email send in parallel
 * 4. Handle partial failures gracefully
 * 5. Return appropriate HTTP response
 */

import { NextRequest, NextResponse } from 'next/server';
import { safeValidateOrder } from '@/lib/types';
import { saveOrder, checkDuplicateOrder } from '@/lib/services/googleSheets';
import { sendOrderEmail } from '@/lib/services/email';

/**
 * CORS headers for API responses.
 */
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

/**
 * POST /api/submit-order
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📦 Received order data');

    // Validate with Zod
    const validation = safeValidateOrder(body);
    
    if (!validation.success) {
      const firstError = validation.errors?.issues[0];
      const errorMessage = firstError?.message || 'بيانات غير صحيحة';
      
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: validation.errors?.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400, headers: corsHeaders() }
      );
    }

    const orderData = validation.data!;

    // Check for duplicates
    const isDuplicate = await checkDuplicateOrder(orderData.clientRequestId);
    if (isDuplicate) {
      console.warn('⚠️ Duplicate order detected:', orderData.clientRequestId);
      return NextResponse.json(
        {
          success: false,
          error: 'تم استلام هذا الطلب مسبقاً. يرجى المحاولة مرة أخرى.',
          duplicate: true,
        },
        { status: 409, headers: corsHeaders() }
      );
    }

    // Check if integrations are enabled
    const sheetsEnabled = process.env.SHEETS_ENABLED !== 'false';
    const emailEnabled = process.env.EMAIL_ENABLED !== 'false';

    // Execute enabled integrations in parallel
    const promises: Promise<{ success: boolean; error?: string; rowNumber?: number }>[] = [];
    if (sheetsEnabled) promises.push(saveOrder(orderData));
    if (emailEnabled) promises.push(sendOrderEmail(orderData));

    // If both are disabled, return error
    if (promises.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'جميع خدمات الإشعارات معطلة. يرجى تفعيلها في الإعدادات.',
        },
        { status: 500, headers: corsHeaders() }
      );
    }

    const results = await Promise.allSettled(promises);
    
    // Extract results based on what was enabled
    let sheetResult: PromiseSettledResult<{ success: boolean; error?: string; rowNumber?: number }> | null = null;
    let emailResult: PromiseSettledResult<{ success: boolean; error?: string }> | null = null;
    
    let resultIndex = 0;
    if (sheetsEnabled) {
      sheetResult = results[resultIndex++];
    }
    if (emailEnabled) {
      emailResult = results[resultIndex++];
    }

    // Extract results
    const sheetSuccess = sheetResult ? (sheetResult.status === 'fulfilled' && sheetResult.value.success) : true;
    const emailSuccess = emailResult ? (emailResult.status === 'fulfilled' && emailResult.value.success) : true;

    // Log results
    if (sheetResult) {
      if (sheetResult.status === 'fulfilled') {
        if (sheetSuccess) {
          console.log('✅ Google Sheets: Order saved');
        } else {
          console.error('❌ Google Sheets failed:', sheetResult.value.error);
        }
      } else {
        console.error('❌ Google Sheets error:', sheetResult.reason);
      }
    }

    if (emailResult) {
      if (emailResult.status === 'fulfilled') {
        if (emailSuccess) {
          console.log('✅ Email: Notification sent');
        } else {
          console.error('❌ Email failed:', emailResult.value.error);
        }
      } else {
        console.error('❌ Email error:', emailResult.reason);
      }
    }

    // Determine response
    const allEnabledFailed = (sheetsEnabled && !sheetSuccess) && (emailEnabled && !emailSuccess);
    
    if (allEnabledFailed) {
      // All enabled integrations failed
      console.error('💥 CRITICAL: All enabled operations failed');
      return NextResponse.json(
        {
          success: false,
          error: 'حدث خطأ في معالجة الطلب. يرجى المحاولة مرة أخرى أو الاتصال بالدعم.',
        },
        { status: 500, headers: corsHeaders() }
      );
    }

    // At least one succeeded or one is disabled
    if (sheetsEnabled && !sheetSuccess) {
      console.warn('⚠️ WARNING: Google Sheets failed');
    }
    if (emailEnabled && !emailSuccess) {
      console.warn('⚠️ WARNING: Email failed');
    }

    // Return success
    return NextResponse.json(
      {
        success: true,
        message: '✅ تم استلام طلبك بنجاح! سنتصل بك خلال 15 دقيقة لتأكيد الطلب.',
        clientRequestId: orderData.clientRequestId,
        sheetSaved: sheetSuccess,
        emailSent: emailSuccess,
      },
      { status: 200, headers: corsHeaders() }
    );
  } catch (error) {
    console.error('💥 API Route Error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          error: 'خطأ في تنسيق البيانات المرسلة.',
        },
        { status: 400, headers: corsHeaders() }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}

/**
 * OPTIONS /api/submit-order
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}
