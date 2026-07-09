"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import ClientPortal from "../ClientPortal";
import Brand from "../Brand";

interface ModalWrapperProps {
  onClose: () => void;
  isOpen: boolean;
  children: React.ReactNode;
}

const ModalWrapper = ({ isOpen, onClose, children }: ModalWrapperProps) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);

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

  if (!shouldRender) return null;

  return (
    <ClientPortal>
      {/* Backdrop transition */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-50 flex justify-end bg-black/50 transition-opacity duration-200 ease-in-out ${
          animate ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Modal Panel */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`relative flex h-full w-full flex-col bg-white shadow-2xl transition-transform duration-200 ease-in-out lg:w-4/5 ${
            animate ? "translate-x-0" : "translate-x-full"
          }`}
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
            id="modal-wrapper"
            className="min-h-0 w-full flex-1 overflow-y-auto p-2"
          >
            {children}
          </div>
        </div>
      </div>
    </ClientPortal>
  );
};

export default ModalWrapper;
