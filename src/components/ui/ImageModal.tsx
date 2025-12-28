/**
 * Image Modal / Lightbox Component
 * 
 * PURPOSE: Full-screen image viewer for product zoom.
 * 
 * FEATURES:
 * - Full-screen modal overlay
 * - High-resolution image display
 * - Close on X button or outside click
 * - Smooth animations
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X } from "lucide-react";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageAlt: string;
}

export default function ImageModal({ isOpen, onClose, imageSrc, imageAlt }: ImageModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 left-4 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
              aria-label="إغلاق"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Image Container */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] w-full"
            >
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-900">
                <Image
                  src={imageSrc}
                  alt={imageAlt}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 80vw"
                  priority
                />
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

