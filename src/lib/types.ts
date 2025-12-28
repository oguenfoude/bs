/**
 * Type Definitions & Validation Schema
 * 
 * PURPOSE: Centralized type definitions and Zod validation schemas.
 * 
 * BUSINESS RULES:
 * - Base Price: 1600 DZD (Discounted from 2200 DZD)
 * - Office Delivery: +500 DZD
 * - Home Delivery: +800 DZD
 * - Total = Base Price + Delivery Cost
 * - 10 Watch Models (IDs: 1 to 10)
 */

import { z } from 'zod';

/**
 * Algerian phone number regex pattern.
 */
const ALGERIAN_PHONE_REGEX = /^(\+213|0)[5-7]\d{8}$/;

/**
 * Order submission schema with strict validation.
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
      ALGERIAN_PHONE_REGEX,
      'رقم الهاتف غير صالح. يرجى إدخال رقم جزائري صحيح (مثال: 0555123456)'
    )
    .trim(),
  
  wilayaId: z
    .number()
    .int()
    .positive()
    .optional(),
  
  wilayaNameAr: z
    .string()
    .min(2, 'اسم الولاية مطلوب')
    .trim(),
  
  baladiya: z
    .string()
    .min(1, 'البلدية مطلوبة')
    .trim(),
  
  baladiyaNameAr: z
    .string()
    .min(2, 'اسم البلدية مطلوب')
    .trim(),
  
  watchModelId: z
    .number()
    .int()
    .min(1, 'يجب اختيار موديل الساعة')
    .max(10, 'موديل الساعة غير صالح'),
  
  deliveryOption: z
    .enum(['office', 'home'], {
      message: 'يجب اختيار طريقة التوصيل',
    }),
  
  totalPrice: z
    .number()
    .positive('السعر الإجمالي يجب أن يكون أكبر من صفر')
    .max(1000000, 'السعر الإجمالي كبير جداً'),
});

/**
 * TypeScript type inferred from Zod schema.
 */
export type OrderInput = z.infer<typeof OrderSchema>;

/**
 * Pricing constants.
 */
export const PRICING = {
  BASE_PRICE: 1600,        // Base price in DZD
  ORIGINAL_PRICE: 2200,    // Original price (for display)
  DELIVERY_OFFICE: 500,    // Office/Stop desk delivery
  DELIVERY_HOME: 800,      // Home delivery
} as const;

/**
 * Calculate total price based on delivery option.
 */
export function calculateTotal(deliveryOption: 'office' | 'home'): number {
  return PRICING.BASE_PRICE + (deliveryOption === 'home' ? PRICING.DELIVERY_HOME : PRICING.DELIVERY_OFFICE);
}

/**
 * Get delivery cost based on option.
 */
export function getDeliveryCost(deliveryOption: 'office' | 'home'): number {
  return deliveryOption === 'home' ? PRICING.DELIVERY_HOME : PRICING.DELIVERY_OFFICE;
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

