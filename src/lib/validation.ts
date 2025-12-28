/**
 * Data Validation Schemas
 * 
 * PURPOSE: Strict validation using Zod for type-safe data validation.
 * 
 * PHONE VALIDATION: Only accepts 05, 06, or 07 at the start (Algerian mobile)
 */

import { z } from 'zod';

/**
 * Algerian mobile phone number regex pattern.
 * 
 * FORMATS ACCEPTED:
 * - 05XXXXXXXX (10 digits, starts with 05)
 * - 06XXXXXXXX (10 digits, starts with 06)
 * - 07XXXXXXXX (10 digits, starts with 07)
 * 
 * WHY: Only Algerian mobile numbers starting with 05, 06, or 07 are accepted.
 */
const ALGERIAN_MOBILE_REGEX = /^(05|06|07)\d{8}$/;

/**
 * Order submission schema.
 */
export const OrderSchema = z.object({
  clientRequestId: z
    .string()
    .uuid('معرف الطلب غير صالح')
    .optional()
    .default(() => crypto.randomUUID()),
  
  fullName: z
    .string()
    .min(2, 'الاسم الكامل يجب أن يكون حرفين على الأقل')
    .max(100, 'الاسم الكامل طويل جداً')
    .trim(),
  
  phone: z
    .string()
    .regex(
      ALGERIAN_MOBILE_REGEX,
      'رقم الهاتف غير صالح. يجب أن يبدأ بـ 05 أو 06 أو 07 ويحتوي على 10 أرقام (مثال: 0555123456)'
    )
    .trim(),
  
  wilayaId: z
    .number()
    .int()
    .positive()
    .optional(),
  
  wilayaNameAr: z
    .string()
    .min(2, 'اسم الولاية مطلوب (حرفان على الأقل)')
    .trim(),
  
  baladiya: z
    .string()
    .min(1, 'البلدية مطلوبة')
    .trim(),
  
  baladiyaNameAr: z
    .string()
    .min(2, 'اسم البلدية مطلوب (حرفان على الأقل)')
    .trim(),
  
  watchModelId: z
    .number()
    .int()
    .positive('يجب اختيار موديل الساعة'),
  
  deliveryOption: z
    .enum(['home', 'office'], {
      message: 'يجب اختيار طريقة التوصيل',
    }),
  
  totalPrice: z
    .number()
    .positive('السعر الإجمالي يجب أن يكون أكبر من صفر')
    .max(1000000, 'السعر الإجمالي كبير جداً'),
  
  notes: z
    .string()
    .max(500, 'الملاحظات طويلة جداً (الحد الأقصى 500 حرف)')
    .trim()
    .optional(),
});

/**
 * TypeScript type inferred from Zod schema.
 */
export type OrderInput = z.infer<typeof OrderSchema>;

/**
 * Validates order data against the schema.
 */
export function validateOrder(data: unknown): OrderInput {
  return OrderSchema.parse(data);
}

/**
 * Safely validates order data and returns result.
 */
export function safeValidateOrder(data: unknown): {
  success: boolean;
  data?: OrderInput;
  errors?: z.ZodError;
} {
  const result = OrderSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error };
}
