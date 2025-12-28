/**
 * Order Data Interface
 * 
 * PURPOSE: Defines the structure of order data submitted by clients.
 * This interface ensures type safety throughout the order processing pipeline.
 * 
 * USAGE: Used by API route, Google Sheets service, and Email service.
 */
export interface OrderData {
  /** Unique identifier for this order request (prevents duplicates) */
  clientRequestId: string;
  /** Customer's full name */
  fullName: string;
  /** Customer's phone number */
  phone: string;
  /** Optional: Wilaya (province) ID number */
  wilayaId?: number;
  /** Wilaya (province) name in Arabic */
  wilayaNameAr: string;
  /** Baladiya (municipality) name */
  baladiya: string;
  /** Baladiya (municipality) name in Arabic */
  baladiyaNameAr: string;
  /** Selected watch model ID (e.g., "w1", "w2", etc.) */
  selectedWatchId: string;
  /** Delivery option: "home" for home delivery, "office" for office delivery */
  deliveryOption: 'home' | 'office';
  /** Total price in Algerian Dinar (DZD) */
  totalPrice: number;
  /** Optional: Additional notes from customer */
  notes?: string;
}
