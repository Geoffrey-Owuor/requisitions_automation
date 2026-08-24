"use client";

import { X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import ClientPortal from "../ClientPortal";
import Brand from "../Brand";
import { useToggleStore } from "@/store/useToggleStore";

interface ModalWrapperProps {
  onClose: () => void;
  isOpen: boolean;
  children: React.ReactNode;
}

const ModalWrapper = ({ isOpen, onClose, children }: ModalWrapperProps) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);

  const scrollTrigger = useToggleStore((state) => state.scrollTrigger);

  const modalWrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      Promise.resolve().then(() => setShouldRender(true));
      // Small double-frame delay ensures the DOM registers the initial state before animating
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimate(true));
      });
      return () => cancelAnimationFrame(frame);
    } else {
      Promise.resolve().then(() => setAnimate(false));
      const timer = setTimeout(() => setShouldRender(false), 200); // Match duration-200
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Listen for the Zustand trigger change
  useEffect(() => {
    const executeScroll = () => {
      requestAnimationFrame(() => {
        modalWrapperRef.current?.scrollTo({ top: 0, behavior: "instant" });
      });
    };

    executeScroll();
  }, [scrollTrigger]);

  if (!shouldRender) return null;

  return (
    <ClientPortal>
      {/* Backdrop transition */}
      <div
        onClick={onClose}
        className={`custom:top-2 custom:bottom-2 custom:right-2 fixed inset-0 z-50 flex justify-end transition-opacity duration-200 ease-in-out ${
          animate ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Modal Panel */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`custom:w-4/5 custom:rounded-r-2xl relative flex h-full w-full flex-col rounded-r-none transition-transform duration-200 ${animate ? "custom:translate-none translate-x-0" : "custom:translate-none translate-x-full"} bg-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.4)]`}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
            <Brand showText={true} />
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div
            ref={modalWrapperRef}
            className="normal-scrollbar min-h-0 w-full flex-1 overflow-y-auto p-2"
          >
            {children}
          </div>
        </div>
      </div>
    </ClientPortal>
  );
};

export default ModalWrapper;
