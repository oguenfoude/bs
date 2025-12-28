"use client";

/**
 * BS MONTERS - High-Conversion Watch Store
 * 
 * Features:
 * - Stable loading animations for all steps
 * - Beautiful landing page
 * - Smooth step transitions
 * - Professional design with Gold/Amber and Rose Red accents
 */

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { PRICING, calculateTotal, getDeliveryCost, safeValidateOrder } from "@/lib/types";
import { trackFbEvent } from "@/components/pixel/FacebookPixel";
import ImageModal from "@/components/ui/ImageModal";
import ProgressBar from "@/components/ui/ProgressBar";
import CountdownBanner from "@/components/ui/CountdownBanner";
import Skeleton, { SkeletonButton, SkeletonCard } from "@/components/ui/Skeleton";
import {
  Watch,
  ShoppingCart,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Home,
  Building2,
  ZoomIn,
  Shield,
  Phone,
  Sparkles,
  Star,
} from "lucide-react";

// Types
type DeliveryOption = "office" | "home";
type Step = "gallery" | "form" | "delivery" | "summary" | "success";

// Watch models (1-10)
const WATCH_MODELS = Array.from({ length: 10 }, (_, i) => i + 1);

// Step labels for progress bar
const STEP_LABELS = ["اختيار الساعة", "المعلومات", "التوصيل", "التأكيد"];

// Helper functions
function formatDZD(v: number) {
  try {
    return new Intl.NumberFormat("ar-DZ").format(v) + " دج";
  } catch {
    return v.toLocaleString() + " دج";
  }
}

// Helper functions no longer needed since we're using text inputs
// function useWilayaOptions() {
//   return useMemo(
//     () =>
//       (wilayas as Array<WilayaItem>)
//         .slice()
//         .sort((a, b) => a.id - b.id)
//         .map((w) => ({ value: w.id, label: w.name_ar })),
//     []
//   );
// }

// function useBaladiyaOptions(wilayaId?: number) {
//   return useMemo(() => {
//     if (!wilayaId) return [];
//     const code = pad2(wilayaId);
//     const wilaya = (cities as CitiesData).wilayas.find((w) => w.code === code);
//     if (!wilaya) return [];
//     const names: string[] = (wilaya.baladiyat || [])
//       .map((b) => (b?.name_ar || "").toString().trim())
//       .filter(Boolean);
//     const unique: string[] = Array.from(new Set(names));
//     unique.sort((a: string, b: string) => a.localeCompare(b, "ar"));
//     return unique;
//   }, [wilayaId]);
// }

// Animation variants for smooth transitions
const stepVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.4 }
  },
  exit: { 
    opacity: 0, 
    y: -20, 
    scale: 0.95,
    transition: { duration: 0.3 }
  }
};

export default function Page() {
  // State
  const [currentStep, setCurrentStep] = useState<Step>("gallery");
  const [selectedWatchId, setSelectedWatchId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    wilayaNameAr: "",
    baladiya: "",
  });
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingStep, setIsLoadingStep] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [modalImage, setModalImage] = useState<{ src: string; alt: string } | null>(null);

  // Data (no longer needed for dropdowns, but keeping for reference)
  // const wilayaOptions = useWilayaOptions();
  // const baladiyaOptions = useBaladiyaOptions(formData.wilayaId);

  // Calculations
  const total = useMemo(() => {
    if (!deliveryOption) return PRICING.BASE_PRICE;
    return calculateTotal(deliveryOption);
  }, [deliveryOption]);

  // Get current step number for progress bar
  const currentStepNumber = useMemo(() => {
    const stepMap: Record<Step, number> = {
      gallery: 1,
      form: 2,
      delivery: 3,
      summary: 4,
      success: 4,
    };
    return stepMap[currentStep];
  }, [currentStep]);

  // Check if form is valid (for button enable/disable)
  const isFormValid = useMemo(() => {
    if (currentStep === "form") {
      const nameValid = formData.fullName.trim().length >= 2;
      const phoneClean = formData.phone.replace(/\s/g, "").replace(/^\+213/, "0");
      const phoneValid = /^(05|06|07)\d{8}$/.test(phoneClean);
      const wilayaValid = formData.wilayaNameAr.trim().length >= 2;
      const baladiyaValid = formData.baladiya.trim().length >= 2;
      return nameValid && phoneValid && wilayaValid && baladiyaValid;
    }
    return true;
  }, [currentStep, formData]);

  // Clear baladiya when wilaya changes (optional - can keep or remove)
  // useEffect(() => {
  //   setFormData((f) => ({ ...f, baladiya: "" }));
  // }, [formData.wilayaNameAr]);

  // Auto-scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  // Handlers with loading states
  const handleSelectWatch = (watchId: number) => {
    setSelectedWatchId(watchId);
    trackFbEvent("AddToCart", {
      content_type: "product",
      content_ids: [watchId],
      content_name: `موديل ${watchId}`,
      value: PRICING.BASE_PRICE,
    });
    
    // Show loading state before transition
    setIsLoadingStep(true);
    setTimeout(() => {
      setCurrentStep("form");
      setIsLoadingStep(false);
    }, 400);
  };

  const handleOpenModal = (watchId: number) => {
    setModalImage({
      src: `/images/watches/${watchId}.jpg`,
      alt: `موديل ${watchId}`,
    });
  };

  const handleNext = () => {
    if (currentStep === "form") {
      const newErrors: Record<string, string> = {};
      
      // Validate full name
      if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
        newErrors.fullName = "الاسم الكامل مطلوب (حرفان على الأقل)";
      }
      
      // Validate phone - must start with 05, 06, or 07 and be exactly 10 digits
      const phoneClean = formData.phone.replace(/\s/g, "").replace(/^\+213/, "0");
      if (!phoneClean || !/^(05|06|07)\d{8}$/.test(phoneClean)) {
        newErrors.phone = "رقم الهاتف غير صالح. يجب أن يبدأ بـ 05 أو 06 أو 07 ويحتوي على 10 أرقام (مثال: 0555123456)";
      }
      
      // Validate wilaya (text input)
      if (!formData.wilayaNameAr.trim() || formData.wilayaNameAr.trim().length < 2) {
        newErrors.wilayaNameAr = "اسم الولاية مطلوب (حرفان على الأقل)";
      }
      
      // Validate baladiya (text input)
      if (!formData.baladiya.trim() || formData.baladiya.trim().length < 2) {
        newErrors.baladiya = "اسم البلدية مطلوب (حرفان على الأقل)";
      }

      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) {
        toast.error("يرجى إكمال جميع الحقول بشكل صحيح");
        return;
      }

      setIsLoadingStep(true);
      setTimeout(() => {
        setCurrentStep("delivery");
        setIsLoadingStep(false);
      }, 300);
    } else if (currentStep === "delivery") {
      if (!deliveryOption) {
        toast.error("يرجى اختيار طريقة التوصيل");
                return;
              }
      setIsLoadingStep(true);
      setTimeout(() => {
        setCurrentStep("summary");
        setIsLoadingStep(false);
      }, 300);
    }
  };

  const handleBack = () => {
    setIsLoadingStep(true);
    setTimeout(() => {
      if (currentStep === "form") {
        setCurrentStep("gallery");
      } else if (currentStep === "delivery") {
        setCurrentStep("form");
      } else if (currentStep === "summary") {
        setCurrentStep("delivery");
      }
      setIsLoadingStep(false);
    }, 300);
  };

  const handleSubmit = async () => {
    if (!selectedWatchId || !deliveryOption) {
      toast.error("يرجى إكمال جميع الخطوات");
                return;
              }

              setIsSubmitting(true);
    const loadingToast = toast.loading("جارٍ معالجة طلبك...", { position: "top-center" });

              try {
      // Clean phone number (remove spaces and +213 prefix if present)
      const phoneClean = formData.phone.replace(/\s/g, "").replace(/^\+213/, "0");

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
        setIsLoadingStep(true);
        setTimeout(() => {
          setCurrentStep("success");
          setIsLoadingStep(false);
        }, 300);
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
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      {/* Countdown Banner */}
      <CountdownBanner />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 shadow-lg">
              <Watch className="w-6 h-6" />
            </div>
                <div>
              <h1 className="text-xl font-bold text-slate-900">BS MONTERS</h1>
              <p className="text-xs text-slate-600">متجر الهدايا و الساعات الفاخرة</p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      {currentStep !== "success" && (
        <ProgressBar
          currentStep={currentStepNumber}
          totalSteps={4}
          stepLabels={STEP_LABELS}
        />
      )}

      <main className="pb-20">
        {/* Hero Section - Enhanced Landing Page */}
        {currentStep === "gallery" && (
          <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-rose-50 py-16 md:py-24">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative mx-auto max-w-5xl px-4 text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="space-y-6"
              >
                {/* Badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-full text-sm font-bold shadow-lg"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>عرض محدود</span>
                </motion.div>

                {/* Main Heading */}
                <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-tight">
                  عرض خاص
                  <br />
                  <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 bg-clip-text text-transparent">
                    {formatDZD(PRICING.BASE_PRICE)}
                  </span>
                  <br />
                  <span className="text-4xl md:text-5xl">فقط</span>
                </h2>

                {/* Subheading */}
                <p className="text-xl md:text-2xl text-slate-700 font-medium">
                  ساعة فاخرة بجودة عالية وضمان الاستبدال
                </p>

                {/* Price Comparison */}
                <div className="flex items-center justify-center gap-4 pt-4">
                  <p className="text-lg text-slate-500 line-through">
                    {formatDZD(PRICING.ORIGINAL_PRICE)}
                  </p>
                  <div className="px-4 py-2 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-lg font-bold text-lg shadow-md">
                    خصم {PRICING.ORIGINAL_PRICE - PRICING.BASE_PRICE} دج
                </div>
                  </div>

                {/* Trust Indicators */}
                <div className="flex items-center justify-center gap-6 pt-6 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    <span>ضمان الاستبدال</span>
                </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500" />
                    <span>جودة عالية</span>
                </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-blue-600" />
                    <span>تأكيد هاتفي</span>
              </div>
            </div>
              </motion.div>
          </div>
        </section>
        )}

        {/* Step 1: Gallery with Loading State */}
        <AnimatePresence mode="wait">
          {isLoadingStep && currentStep === "gallery" ? (
            <motion.div
              key="loading-gallery"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={stepVariants}
              className="py-12 md:py-16"
            >
              <div className="mx-auto max-w-6xl px-4">
                <Skeleton variant="text" className="h-8 w-64 mx-auto mb-8" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} variant="card" className="aspect-square" />
                  ))}
              </div>
              </div>
            </motion.div>
          ) : currentStep === "gallery" ? (
            <motion.section
              key="gallery"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={stepVariants}
              className="py-12 md:py-16"
            >
              <div className="mx-auto max-w-6xl px-4">
                <h3 className="text-3xl md:text-4xl font-bold text-center mb-4 text-slate-900">
                  اختر موديل الساعة
                </h3>
                <p className="text-center text-slate-600 mb-10">10 موديلات فاخرة - نفس السعر</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6">
                  {WATCH_MODELS.map((watchId, index) => {
                    const isSelected = selectedWatchId === watchId;
                      return (
                      <motion.div
                        key={watchId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        className={`relative aspect-square rounded-2xl overflow-hidden border-4 transition-all duration-300 ${
                          isSelected
                            ? "border-amber-500 shadow-2xl scale-105 ring-4 ring-amber-200"
                            : "border-slate-200 hover:border-amber-300 hover:shadow-xl"
                        }`}
                      >
                        <button
                          onClick={() => handleSelectWatch(watchId)}
                          className="w-full h-full relative group"
                        >
                          <Image
                            src={`/images/watches/${watchId}.jpg`}
                            alt={`موديل ${watchId}`}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                          />
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 left-2 bg-amber-500 text-white rounded-full p-1.5 shadow-lg z-10"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </motion.div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent p-3">
                            <p className="text-white text-sm font-bold text-center">
                              موديل {watchId}
                            </p>
                          </div>
                        </button>
                      <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(watchId);
                          }}
                          className="absolute top-2 right-2 bg-white/95 hover:bg-white text-slate-700 rounded-lg p-2 shadow-lg transition-all z-10"
                          aria-label="تكبير الصورة"
                        >
                          <ZoomIn className="w-4 h-4" />
                      </button>
                        <div className="absolute top-2 right-12 bg-amber-500/95 text-white text-[10px] px-2 py-1 rounded-full font-bold shadow-md">
                          🔍 اضغط للتكبير
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              {selectedWatchId && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 text-center"
                  >
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-amber-50 border-2 border-amber-200 rounded-xl">
                      <CheckCircle2 className="w-5 h-5 text-amber-600" />
                      <p className="text-amber-800 font-semibold">تم اختيار موديل {selectedWatchId}</p>
                    </div>
                  </motion.div>
              )}
            </div>
            </motion.section>
          ) : null}
        </AnimatePresence>

        {/* Step 2: Form with Loading State */}
        <AnimatePresence mode="wait">
          {isLoadingStep && currentStep === "form" ? (
            <motion.div
              key="loading-form"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={stepVariants}
              className="py-12 md:py-16 bg-slate-50"
            >
              <div className="mx-auto max-w-2xl px-4">
                <SkeletonCard />
            </div>
            </motion.div>
          ) : currentStep === "form" ? (
            <motion.section
              key="form"
              id="order-form"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={stepVariants}
              className="py-12 md:py-16 bg-slate-50"
            >
              <div className="mx-auto max-w-2xl px-4">
                <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-slate-100">
                  <h3 className="text-2xl md:text-3xl font-bold mb-8 text-slate-900 text-center">
                    معلومات العميل
                  </h3>
                  <div className="space-y-6">
                <div>
                      <label className="block text-sm font-bold mb-2 text-slate-800">
                    الاسم الكامل
                  </label>
                    <input
                      type="text"
                      value={formData.fullName}
                        onChange={(e) => {
                          setFormData((f) => ({ ...f, fullName: e.target.value }));
                          if (errors.fullName) setErrors((e) => ({ ...e, fullName: "" }));
                        }}
                      placeholder="أحمد محمد"
                        className={`w-full rounded-xl border-2 px-4 py-4 text-base transition-all ${
                          errors.fullName
                            ? "border-red-500 bg-red-50"
                            : "border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                        } focus:outline-none`}
                      />
                      {errors.fullName && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-red-600 text-sm mt-2 flex items-center gap-1"
                        >
                          <span>⚠️</span> {errors.fullName}
                        </motion.p>
                  )}
                </div>

                <div>
                      <label className="block text-sm font-bold mb-2 text-slate-800">
                    رقم الهاتف
                  </label>
                    <input
                      type="tel"
                      value={formData.phone}
                        onChange={(e) => {
                          setFormData((f) => ({ ...f, phone: e.target.value }));
                          if (errors.phone) setErrors((e) => ({ ...e, phone: "" }));
                        }}
                        placeholder="0555123456 (يجب أن يبدأ بـ 05 أو 06 أو 07)"
                        className={`w-full rounded-xl border-2 px-4 py-4 text-base transition-all ${
                          errors.phone
                            ? "border-red-500 bg-red-50"
                            : "border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                        } focus:outline-none`}
                      />
                      {errors.phone && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-red-600 text-sm mt-2 flex items-center gap-1"
                        >
                          <span>⚠️</span> {errors.phone}
                        </motion.p>
                  )}
                </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                        <label className="block text-sm font-bold mb-2 text-slate-800">
                    الولاية
                  </label>
                        <input
                          type="text"
                          value={formData.wilayaNameAr}
                          onChange={(e) => {
                            setFormData((f) => ({ ...f, wilayaNameAr: e.target.value }));
                            if (errors.wilayaNameAr) setErrors((e) => ({ ...e, wilayaNameAr: "" }));
                          }}
                          placeholder="مثال: الجزائر"
                          className={`w-full rounded-xl border-2 px-4 py-4 text-base transition-all ${
                            errors.wilayaNameAr
                              ? "border-red-500 bg-red-50"
                              : "border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                          } focus:outline-none`}
                        />
                        {errors.wilayaNameAr && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-red-600 text-sm mt-2 flex items-center gap-1"
                          >
                            <span>⚠️</span> {errors.wilayaNameAr}
                          </motion.p>
                  )}
                </div>

                <div>
                        <label className="block text-sm font-bold mb-2 text-slate-800">
                    البلدية
                  </label>
                        <input
                          type="text"
                          value={formData.baladiya}
                          onChange={(e) => {
                            setFormData((f) => ({ ...f, baladiya: e.target.value }));
                            if (errors.baladiya) setErrors((e) => ({ ...e, baladiya: "" }));
                          }}
                          placeholder="مثال: باب الزوار"
                          className={`w-full rounded-xl border-2 px-4 py-4 text-base transition-all ${
                            errors.baladiya
                              ? "border-red-500 bg-red-50"
                              : "border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                          } focus:outline-none`}
                        />
                        {errors.baladiya && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-red-600 text-sm mt-2 flex items-center gap-1"
                          >
                            <span>⚠️</span> {errors.baladiya}
                          </motion.p>
                        )}
                    </div>
                  </div>
                </div>
                </div>
              </div>
            </motion.section>
          ) : null}
        </AnimatePresence>

        {/* Step 3: Delivery with Loading State */}
        <AnimatePresence mode="wait">
          {isLoadingStep && currentStep === "delivery" ? (
            <motion.div
              key="loading-delivery"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={stepVariants}
              className="py-12 md:py-16"
            >
              <div className="mx-auto max-w-4xl px-4">
                <Skeleton variant="text" className="h-8 w-64 mx-auto mb-8" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SkeletonCard />
                  <SkeletonCard />
                      </div>
                      </div>
            </motion.div>
          ) : currentStep === "delivery" ? (
            <motion.section
              key="delivery"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={stepVariants}
              className="py-12 md:py-16"
            >
              <div className="mx-auto max-w-4xl px-4">
                <h3 className="text-3xl md:text-4xl font-bold text-center mb-4 text-slate-900">
                  اختر طريقة التوصيل
                </h3>
                <p className="text-center text-slate-600 mb-10">اختر الطريقة المناسبة لك</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.button
                    onClick={() => setDeliveryOption("office")}
                    className={`relative p-8 rounded-3xl border-4 transition-all duration-300 text-right ${
                      deliveryOption === "office"
                        ? "border-amber-500 bg-gradient-to-br from-amber-50 to-amber-100 shadow-2xl scale-105"
                        : "border-slate-200 bg-white hover:border-amber-300 hover:shadow-xl"
                    }`}
                    whileHover={{ scale: deliveryOption === "office" ? 1.05 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Building2 className={`w-14 h-14 mb-4 ${deliveryOption === "office" ? "text-amber-600" : "text-slate-400"}`} />
                    <h4 className="text-2xl font-bold mb-2 text-slate-900">
                      توصيل للمكتب (Yalidine)
                    </h4>
                    <p className="text-slate-600 mb-4 text-base">تستلمها بنفسك من مكتب ياليدين في ولايتك.</p>
                    <p className="text-2xl font-bold text-amber-600">
                      +{formatDZD(PRICING.DELIVERY_OFFICE)}
                    </p>
                    {deliveryOption === "office" && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-4 left-4 bg-amber-500 text-white rounded-full p-2 shadow-lg"
                      >
                        <CheckCircle2 className="w-6 h-6" />
                      </motion.div>
                    )}
                  </motion.button>

                  <motion.button
                    onClick={() => setDeliveryOption("home")}
                    className={`relative p-8 rounded-3xl border-4 transition-all duration-300 text-right ${
                      deliveryOption === "home"
                        ? "border-amber-500 bg-gradient-to-br from-amber-50 to-amber-100 shadow-2xl scale-105"
                        : "border-slate-200 bg-white hover:border-amber-300 hover:shadow-xl"
                    }`}
                    whileHover={{ scale: deliveryOption === "home" ? 1.05 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Home className={`w-14 h-14 mb-4 ${deliveryOption === "home" ? "text-amber-600" : "text-slate-400"}`} />
                    <h4 className="text-2xl font-bold mb-2 text-slate-900">
                      توصيل للمنزل
                    </h4>
                    <p className="text-slate-600 mb-4 text-base">يوصلها عامل التوصيل حتى باب دارك.</p>
                    <p className="text-2xl font-bold text-amber-600">
                      +{formatDZD(PRICING.DELIVERY_HOME)}
                    </p>
                    {deliveryOption === "home" && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-4 left-4 bg-amber-500 text-white rounded-full p-2 shadow-lg"
                      >
                        <CheckCircle2 className="w-6 h-6" />
                      </motion.div>
                    )}
                  </motion.button>
                    </div>
              </div>
            </motion.section>
          ) : null}
        </AnimatePresence>

        {/* Step 4: Summary with Loading State */}
        <AnimatePresence mode="wait">
          {isLoadingStep && currentStep === "summary" ? (
            <motion.div
              key="loading-summary"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={stepVariants}
              className="py-12 md:py-16 bg-slate-50"
            >
              <div className="mx-auto max-w-2xl px-4">
                <SkeletonCard />
              </div>
            </motion.div>
          ) : currentStep === "summary" ? (
            <motion.section
              key="summary"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={stepVariants}
              className="py-12 md:py-16 bg-slate-50"
            >
              <div className="mx-auto max-w-2xl px-4">
                <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-slate-100">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl md:text-3xl font-bold mb-2 text-slate-900">
                      مراجعة الطلب النهائية
                    </h3>
                    <p className="text-slate-600 text-sm">
                      راجع معلوماتك ثم اضغط على تأكيد الطلب
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Product Preview */}
                    <div className="flex items-center gap-6 p-5 bg-gradient-to-r from-amber-50 to-amber-100 rounded-2xl border-2 border-amber-200">
                      <div className="relative w-28 h-28 rounded-xl overflow-hidden border-4 border-amber-500 shadow-lg">
                        {selectedWatchId && (
                          <Image
                            src={`/images/watches/${selectedWatchId}.jpg`}
                            alt={`موديل ${selectedWatchId}`}
                            fill
                            className="object-cover"
                            sizes="112px"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-lg text-slate-900">موديل الساعة {selectedWatchId}</p>
                        <p className="text-sm text-slate-600">سعر المنتج</p>
                      </div>
                      <div className="text-2xl font-extrabold text-amber-700">
                        {formatDZD(PRICING.BASE_PRICE)}
                    </div>
                </div>

                    {/* Price Breakdown */}
                    <div className="space-y-4 border-t border-b border-slate-200 py-6">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700 font-medium">سعر المنتج</span>
                        <span className="font-bold text-lg">{formatDZD(PRICING.BASE_PRICE)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700 font-medium">
                          تكلفة التوصيل ({deliveryOption === "home" ? "منزل" : "مكتب"})
                        </span>
                        <span className="font-bold text-lg">
                          {formatDZD(getDeliveryCost(deliveryOption!))}
                        </span>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center p-6 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl shadow-lg">
                      <span className="text-2xl font-bold text-white">الإجمالي</span>
                      <span className="text-3xl font-extrabold text-white">
                        {formatDZD(total)}
                      </span>
                    </div>

                    {/* Customer Info */}
                    <div className="p-5 bg-slate-50 rounded-2xl space-y-3 text-sm border border-slate-200">
                      <p className="font-semibold text-slate-900">
                        <span className="text-slate-600">الاسم:</span> {formData.fullName}
                      </p>
                      <p className="font-semibold text-slate-900">
                        <span className="text-slate-600">الهاتف:</span> {formData.phone}
                      </p>
                      <p className="font-semibold text-slate-900">
                        <span className="text-slate-600">العنوان:</span> {formData.baladiya},{" "}
                        {formData.wilayaNameAr}
                      </p>
                    </div>

                    {/* Trust Badges */}
                    <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl space-y-4 shadow-sm">
                      <div className="flex items-start gap-4">
                        <Shield className="w-7 h-7 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-green-800 mb-1 text-lg">
                            ✅ ضمان الاستبدال في حالة وجود مشكلة
                          </p>
                          <p className="text-sm text-green-700">
                            نضمن لك استبدال المنتج في حالة وجود أي عيب أو مشكلة
                          </p>
                    </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <Phone className="w-7 h-7 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-green-800 mb-1 text-lg">
                            📞 سنتصل بك هاتفياً لتأكيد الطلب قبل الإرسال
                          </p>
                          <p className="text-sm text-green-700">
                            سيتصل بك فريقنا خلال 15 دقيقة لتأكيد تفاصيل الطلب
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                      {isSubmitting ? (
                        <SkeletonButton className="h-16" />
                      ) : (
                        <motion.button
                          onClick={handleSubmit}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 hover:from-rose-700 hover:via-red-700 hover:to-rose-700 text-white font-bold py-5 px-6 rounded-2xl text-xl transition-all shadow-2xl flex items-center justify-center gap-3"
                        >
                          <ShoppingCart className="w-6 h-6" />
                          تأكيد الطلب - {formatDZD(total)}
                        </motion.button>
                  )}
                </div>
          </div>
        </div>
              </div>
            </motion.section>
          ) : null}
        </AnimatePresence>

        {/* Success State */}
        {currentStep === "success" && (
          <motion.section
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="py-20"
          >
            <div className="mx-auto max-w-md px-4 text-center">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-28 h-28 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
              >
                <CheckCircle2 className="w-16 h-16 text-green-600" />
              </motion.div>
              <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                شكراً لك! تم استلام طلبك بنجاح.
                </h3>
              <p className="text-lg text-slate-700 mb-8 leading-relaxed">
                  سنتصل بك خلال 15 دقيقة لتأكيد الطلب وتحديد موعد التوصيل
                </p>
              <motion.button
                  onClick={() => {
                  setCurrentStep("gallery");
                    setSelectedWatchId(null);
                  setFormData({ fullName: "", phone: "", wilayaNameAr: "", baladiya: "" });
                    setDeliveryOption(null);
                    setErrors({});
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-2xl font-bold text-lg hover:from-amber-700 hover:to-amber-800 shadow-xl transition-all"
              >
                العودة للصفحة الرئيسية
              </motion.button>
              </div>
          </motion.section>
        )}

        {/* Navigation Buttons */}
        {currentStep !== "gallery" && currentStep !== "success" && currentStep !== "summary" && (
          <div className="py-8 bg-slate-50 border-t border-slate-200">
            <div className="mx-auto max-w-2xl px-4 flex gap-4 justify-between">
              <motion.button
                onClick={handleBack}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 border-2 border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-400 flex items-center gap-2 transition-all"
              >
                <ArrowRight className="w-5 h-5" />
                السابق
              </motion.button>
              <motion.button
                onClick={handleNext}
                disabled={
                  (currentStep === "form" && !isFormValid) ||
                  (currentStep === "delivery" && !deliveryOption)
                }
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-10 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl font-semibold hover:from-amber-700 hover:to-amber-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-lg"
              >
                التالي
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
            </div>
            </div>
        )}

        {/* Back Button for Summary Step Only */}
        {currentStep === "summary" && (
          <div className="py-8 bg-slate-50 border-t border-slate-200">
            <div className="mx-auto max-w-2xl px-4">
              <motion.button
                onClick={handleBack}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-8 py-3 border-2 border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-400 flex items-center justify-center gap-2 transition-all"
              >
                <ArrowRight className="w-5 h-5" />
                السابق
              </motion.button>
          </div>
          </div>
        )}
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
