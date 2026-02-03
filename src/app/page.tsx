"use client";

/**
 * BS MONTERS - Single Page Product Layout
 *
 * Features:
 * - Single-page layout matching kingdomofluxury.shop design
 * - Image gallery with model navigation (Previous/Next arrows)
 * - Product info and form all visible at once
 * - Clean, clear design
 */

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { PRICING, calculateTotal, safeValidateOrder } from "@/lib/types";
import { trackFbEvent } from "@/components/pixel/FacebookPixel";
import ImageModal from "@/components/ui/ImageModal";
import CountdownBanner from "@/components/ui/CountdownBanner";
import {
  Watch,
  ShoppingCart,
  CheckCircle2,
  Home,
  Building2,
  ZoomIn,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Types
type DeliveryOption = "office" | "home";

// Watch models (1-10)
const WATCH_MODELS = Array.from({ length: 10 }, (_, i) => i + 1);

// Helper functions
function formatDZD(v: number) {
  try {
    return new Intl.NumberFormat("ar-DZ").format(v) + " دج";
  } catch {
    return v.toLocaleString() + " دج";
  }
}

export default function Page() {
  // State
  const [selectedWatchId, setSelectedWatchId] = useState<number>(1); // Default to model 1
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    wilayaNameAr: "",
    baladiya: "",
    modelNumber: "1", // Default to model 1
  });
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption | null>(
    null,
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [modalImage, setModalImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);
  const [viewerCount, setViewerCount] = useState<number>(8); // Fake viewer count
  const [stockCount] = useState<number>(6); // Fake stock count

  // Track AddToCart when model changes
  useEffect(() => {
    if (selectedWatchId) {
      trackFbEvent("AddToCart", {
        content_type: "product",
        content_ids: [selectedWatchId],
        content_name: `موديل ${selectedWatchId}`,
        value: PRICING.BASE_PRICE,
      });
    }
  }, [selectedWatchId]);

  // Animate viewer count
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount((prev) => {
        const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        return Math.max(5, Math.min(15, prev + change));
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Calculations
  const total = useMemo(() => {
    if (!deliveryOption) return PRICING.BASE_PRICE * quantity;
    return calculateTotal(deliveryOption) * quantity;
  }, [deliveryOption, quantity]);

  // Navigation handlers
  const handlePrevModel = () => {
    const newId = selectedWatchId === 1 ? 10 : selectedWatchId - 1;
    setSelectedWatchId(newId);
    setFormData((f) => ({ ...f, modelNumber: newId.toString() }));
  };

  const handleNextModel = () => {
    const newId = selectedWatchId === 10 ? 1 : selectedWatchId + 1;
    setSelectedWatchId(newId);
    setFormData((f) => ({ ...f, modelNumber: newId.toString() }));
  };

  const handleOpenModal = () => {
    setModalImage({
      src: `/images/watches/${selectedWatchId}.webp`,
      alt: `موديل ${selectedWatchId}`,
    });
  };

  // Validation
  const isFormValid = useMemo(() => {
    const nameValid = formData.fullName.trim().length >= 2;
    const phoneClean = formData.phone.replace(/\s/g, "").replace(/^\+213/, "0");
    const phoneValid = /^(05|06|07)\d{8}$/.test(phoneClean);
    const wilayaValid = formData.wilayaNameAr.trim().length >= 2;
    const baladiyaValid = formData.baladiya.trim().length >= 2;
    const modelNumberValid = formData.modelNumber.trim().length >= 1;
    return (
      nameValid &&
      phoneValid &&
      wilayaValid &&
      baladiyaValid &&
      modelNumberValid &&
      deliveryOption !== null
    );
  }, [formData, deliveryOption]);

  // Submit handler
  const handleSubmit = async () => {
    // Validate all fields
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      newErrors.fullName = "الاسم الكامل مطلوب (حرفان على الأقل)";
    }

    const phoneClean = formData.phone.replace(/\s/g, "").replace(/^\+213/, "0");
    if (!phoneClean || !/^(05|06|07)\d{8}$/.test(phoneClean)) {
      newErrors.phone =
        "رقم الهاتف غير صالح. يجب أن يبدأ بـ 05 أو 06 أو 07 ويحتوي على 10 أرقام";
    }

    if (
      !formData.wilayaNameAr.trim() ||
      formData.wilayaNameAr.trim().length < 2
    ) {
      newErrors.wilayaNameAr = "اسم الولاية مطلوب (حرفان على الأقل)";
    }

    if (!formData.baladiya.trim() || formData.baladiya.trim().length < 2) {
      newErrors.baladiya = "اسم البلدية مطلوب (حرفان على الأقل)";
    }

    if (
      !formData.modelNumber.trim() ||
      formData.modelNumber.trim().length < 1
    ) {
      newErrors.modelNumber =
        "رقم النموذج مطلوب. يرجى إدخال رقم النموذج الموضح في الصورة";
    }

    if (!deliveryOption) {
      toast.error("يرجى اختيار طريقة التوصيل");
      return;
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error("يرجى إكمال جميع الحقول بشكل صحيح");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("جارٍ معالجة طلبك...", {
      position: "top-center",
    });

    try {
      const orderData = {
        fullName: formData.fullName.trim(),
        phone: phoneClean,
        wilayaNameAr: formData.wilayaNameAr.trim(),
        baladiya: formData.baladiya.trim(),
        baladiyaNameAr: formData.baladiya.trim(),
        watchModelId: selectedWatchId,
        deliveryOption,
        totalPrice: total,
        clientRequestId: crypto.randomUUID(),
        modelNumber: formData.modelNumber.trim(),
        quantity,
      };

      const validation = safeValidateOrder(orderData);
      if (!validation.success) {
        const firstError = validation.errors?.issues?.[0];
        throw new Error(firstError?.message || "بيانات غير صحيحة");
      }

      const response = await fetch("/api/submit-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();
      toast.dismiss(loadingToast);

      if (result.success) {
        trackFbEvent("Purchase", {
          content_type: "product",
          content_ids: [selectedWatchId],
          value: total,
        });

        toast.success("✅ تم استلام طلبك بنجاح! سنتصل بك قريباً.", {
          duration: 5000,
          position: "top-center",
        });

        // Reset form
        setFormData({
          fullName: "",
          phone: "",
          wilayaNameAr: "",
          baladiya: "",
          modelNumber: selectedWatchId.toString(),
        });
        setDeliveryOption(null);
        setQuantity(1);
        setErrors({});
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        toast.error(result.error || "حدث خطأ بسيط، يرجى المحاولة مرة أخرى", {
          duration: 5000,
          position: "top-center",
        });
      }
    } catch {
      toast.dismiss(loadingToast);
      toast.error("فشل في الاتصال بالخادم. يرجى المحاولة مرة أخرى.", {
        duration: 5000,
        position: "top-center",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 shadow-lg">
              <Watch className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">BS MONTERS</h1>
              <p className="text-xs text-slate-600">
                متجر الهدايا و الساعات الفاخرة
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="py-8 md:py-12">
        <div className="mx-auto max-w-7xl px-4">
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left Column: Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 shadow-2xl border-4 border-slate-200">
                <Image
                  src={`/images/watches/${selectedWatchId}.webp`}
                  alt={`موديل ${selectedWatchId}`}
                  fill
                  className="object-cover transition-all duration-500"
                  priority
                  quality={95}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />

                {/* Model Number Badge */}
                <div className="absolute top-4 right-4 bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
                  <span className="text-sm font-bold">
                    موديل {selectedWatchId}
                  </span>
                </div>

                {/* Zoom Button */}
                <button
                  onClick={handleOpenModal}
                  className="absolute top-4 left-4 bg-white/95 hover:bg-white text-slate-700 rounded-lg p-3 shadow-lg transition-all z-10"
                  aria-label="تكبير الصورة"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>

                {/* Navigation Arrows */}
                <button
                  onClick={handlePrevModel}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-slate-700 rounded-full p-3 shadow-lg transition-all z-10"
                  aria-label="النموذج السابق"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNextModel}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-slate-700 rounded-full p-3 shadow-lg transition-all z-10"
                  aria-label="النموذج التالي"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </div>

              {/* Thumbnail Strip */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {WATCH_MODELS.map((watchId) => (
                  <button
                    key={watchId}
                    onClick={() => {
                      setSelectedWatchId(watchId);
                      setFormData((f) => ({
                        ...f,
                        modelNumber: watchId.toString(),
                      }));
                    }}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 transition-all duration-200 border-2 ${
                      selectedWatchId === watchId
                        ? "border-amber-500 scale-110 ring-2 ring-amber-200"
                        : "border-slate-200 hover:border-amber-300 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={`/images/watches/${watchId}.webp`}
                      alt={`موديل ${watchId}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Product Info + Form */}
            <div className="space-y-6">
              {/* Product Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                الساعة الأكثر طلبا
              </h1>

              {/* Price */}
              <div className="flex items-center gap-4">
                <div className="text-3xl md:text-4xl font-bold text-rose-600">
                  {formatDZD(PRICING.BASE_PRICE)}
                </div>
                <div className="text-xl text-slate-500 line-through">
                  {formatDZD(PRICING.ORIGINAL_PRICE)}
                </div>
              </div>

              {/* Urgency Messages */}
              <div className="space-y-2">
                <p className="text-lg font-semibold text-rose-600">
                  سارع! فقط {stockCount} قطعة متبقية في المخزن!
                </p>
                <p className="text-sm text-slate-600">
                  يشاهده{" "}
                  <span className="font-bold text-amber-600">
                    {viewerCount}
                  </span>{" "}
                  متصفح في الوقت الحالي.
                </p>
              </div>

              {/* Trust Badges */}
              <div className="space-y-2 p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border-2 border-amber-200">
                <p className="font-bold text-amber-800 text-base">
                  ✅ الهدية الأمثل لأحبائكم
                </p>
                <p className="text-sm text-amber-700">
                  ملاحظة كل الصور حقيقية مصورة من طرفنا
                </p>
              </div>

              {/* Countdown Timer - Under Text */}
              <CountdownBanner />

              {/* Customer Info Form - FIRST */}
              <div className="border-t border-slate-200 pt-6">
                <h2 className="text-xl font-bold mb-4 text-slate-900">
                  معلومات الزبون
                </h2>
                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-800">
                      الاسم الكامل
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => {
                        setFormData((f) => ({
                          ...f,
                          fullName: e.target.value,
                        }));
                        if (errors.fullName)
                          setErrors((e) => ({ ...e, fullName: "" }));
                      }}
                      placeholder="أحمد محمد"
                      className={`w-full rounded-lg border-2 px-4 py-3 text-base transition-all ${
                        errors.fullName
                          ? "border-red-500 bg-red-50"
                          : "border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                      } focus:outline-none`}
                    />
                    {errors.fullName && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.fullName}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-800">
                      رقم الهاتف
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData((f) => ({ ...f, phone: e.target.value }));
                        if (errors.phone)
                          setErrors((e) => ({ ...e, phone: "" }));
                      }}
                      placeholder="0555123456"
                      className={`w-full rounded-lg border-2 px-4 py-3 text-base transition-all ${
                        errors.phone
                          ? "border-red-500 bg-red-50"
                          : "border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                      } focus:outline-none`}
                    />
                    {errors.phone && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Wilaya */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-800">
                      الولاية
                    </label>
                    <input
                      type="text"
                      value={formData.wilayaNameAr}
                      onChange={(e) => {
                        setFormData((f) => ({
                          ...f,
                          wilayaNameAr: e.target.value,
                        }));
                        if (errors.wilayaNameAr)
                          setErrors((e) => ({ ...e, wilayaNameAr: "" }));
                      }}
                      placeholder="مثال: الجزائر"
                      className={`w-full rounded-lg border-2 px-4 py-3 text-base transition-all ${
                        errors.wilayaNameAr
                          ? "border-red-500 bg-red-50"
                          : "border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                      } focus:outline-none`}
                    />
                    {errors.wilayaNameAr && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.wilayaNameAr}
                      </p>
                    )}
                  </div>

                  {/* Baladiya */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-800">
                      البلدية
                    </label>
                    <input
                      type="text"
                      value={formData.baladiya}
                      onChange={(e) => {
                        setFormData((f) => ({
                          ...f,
                          baladiya: e.target.value,
                        }));
                        if (errors.baladiya)
                          setErrors((e) => ({ ...e, baladiya: "" }));
                      }}
                      placeholder="مثال: باب الزوار"
                      className={`w-full rounded-lg border-2 px-4 py-3 text-base transition-all ${
                        errors.baladiya
                          ? "border-red-500 bg-red-50"
                          : "border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                      } focus:outline-none`}
                    />
                    {errors.baladiya && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.baladiya}
                      </p>
                    )}
                  </div>

                  {/* Model Number Input - Required */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-800">
                      أدخل رقم النموذج الموضح في الصورة{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.modelNumber}
                      onChange={(e) => {
                        setFormData((f) => ({
                          ...f,
                          modelNumber: e.target.value,
                        }));
                        if (errors.modelNumber)
                          setErrors((e) => ({ ...e, modelNumber: "" }));
                      }}
                      placeholder={`${selectedWatchId} (مطلوب)`}
                      className={`w-full rounded-lg border-2 px-4 py-3 text-base transition-all ${
                        errors.modelNumber
                          ? "border-red-500 bg-red-50"
                          : "border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                      } focus:outline-none`}
                    />
                    {errors.modelNumber && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.modelNumber}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      يرجى إدخال رقم النموذج الموضح في الصورة أعلاه
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery Options - AFTER Form */}
              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-lg font-bold mb-4 text-slate-900">
                  اختر طريقة التوصيل
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.button
                    onClick={() => setDeliveryOption("office")}
                    className={`relative p-5 rounded-xl border-2 transition-all duration-300 text-right ${
                      deliveryOption === "office"
                        ? "border-amber-500 bg-gradient-to-br from-amber-50 to-amber-100 shadow-lg"
                        : "border-slate-200 bg-white hover:border-amber-300"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Building2
                      className={`w-8 h-8 mb-2 ${deliveryOption === "office" ? "text-amber-600" : "text-slate-400"}`}
                    />
                    <h4 className="text-base font-bold mb-1 text-slate-900">
                      توصيل للمكتب (Yalidine)
                    </h4>
                    <p className="text-xs text-slate-600 mb-2">
                      تستلمها بنفسك من مكتب ياليدين في ولايتك.
                    </p>
                    <p className="text-lg font-bold text-amber-600">
                      +{formatDZD(PRICING.DELIVERY_OFFICE)}
                    </p>
                    {deliveryOption === "office" && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-3 left-3 bg-amber-500 text-white rounded-full p-1.5 shadow-lg"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </motion.div>
                    )}
                  </motion.button>

                  <motion.button
                    onClick={() => setDeliveryOption("home")}
                    className={`relative p-5 rounded-xl border-2 transition-all duration-300 text-right ${
                      deliveryOption === "home"
                        ? "border-amber-500 bg-gradient-to-br from-amber-50 to-amber-100 shadow-lg"
                        : "border-slate-200 bg-white hover:border-amber-300"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Home
                      className={`w-8 h-8 mb-2 ${deliveryOption === "home" ? "text-amber-600" : "text-slate-400"}`}
                    />
                    <h4 className="text-base font-bold mb-1 text-slate-900">
                      توصيل للمنزل
                    </h4>
                    <p className="text-xs text-slate-600 mb-2">
                      يوصلها عامل التوصيل حتى باب دارك.
                    </p>
                    <p className="text-lg font-bold text-amber-600">
                      +{formatDZD(PRICING.DELIVERY_HOME)}
                    </p>
                    {deliveryOption === "home" && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-3 left-3 bg-amber-500 text-white rounded-full p-1.5 shadow-lg"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </motion.div>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Total Price - AFTER Delivery */}
              {deliveryOption && (
                <div className="p-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl text-white shadow-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">الإجمالي</span>
                    <span className="text-2xl font-extrabold">
                      {formatDZD(total)}
                    </span>
                  </div>
                </div>
              )}

              {/* Trust Note */}
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-green-800 mb-1">
                      ✅ ضمان الاستبدال في حالة وجود مشكلة
                    </p>
                    <p className="text-sm text-green-700">
                      سنتصل بك هاتفياً لتأكيد الطلب قبل الإرسال
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Button - LAST */}
              <motion.button
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
                whileHover={{ scale: isFormValid ? 1.02 : 1 }}
                whileTap={{ scale: isFormValid ? 0.98 : 1 }}
                className="w-full bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 hover:from-rose-700 hover:via-red-700 hover:to-rose-700 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جارٍ المعالجة...</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-6 h-6" />
                    <span>اضغط هنا للطلب</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 bg-slate-900 text-slate-300 py-8">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} BS MONTERS - جميع الحقوق محفوظة
          </p>
        </div>
      </footer>

      {/* Image Modal */}
      {modalImage && (
        <ImageModal
          isOpen={!!modalImage}
          onClose={() => setModalImage(null)}
          imageSrc={modalImage.src}
          imageAlt={modalImage.alt}
        />
      )}
    </div>
  );
}
