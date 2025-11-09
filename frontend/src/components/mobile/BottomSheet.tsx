"use client";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  subtitle?: string;
  height?: "auto" | "half" | "full";
  showHandle?: boolean;
  closeOnBackdropClick?: boolean;
}

export default function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  height = "auto",
  showHandle = true,
  closeOnBackdropClick = true,
}: BottomSheetProps) {
  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const heightClasses = {
    auto: "max-h-[85vh]",
    half: "h-[50vh]",
    full: "h-[95vh]",
  };

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.y > 100) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={closeOnBackdropClick ? onClose : undefined}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className={`
              fixed bottom-0 left-0 right-0 z-50
              bg-white dark:bg-gray-800
              rounded-t-3xl shadow-2xl
              ${heightClasses[height]}
              overflow-hidden
              touch-manipulation
            `}
          >
            {/* Drag Handle */}
            {showHandle && (
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>
            )}

            {/* Header */}
            {(title || subtitle) && (
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {title && (
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {title}
                      </h3>
                    )}
                    {subtitle && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {subtitle}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all touch-manipulation"
                    aria-label="Close"
                  >
                    <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            )}

            {/* Content */}
            <div
              className="overflow-y-auto overscroll-contain p-6 max-h-[calc(100%-100px)]"
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
