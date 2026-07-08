"use client";

import { X } from "lucide-react";
import ClientPortal from "../ClientPortal";
import Brand from "../Brand";

interface ModalWrapperProps {
  onClose: () => void;
  isOpen: boolean;
  children: React.ReactNode;
}

const ModalWrapper = ({ isOpen, onClose, children }: ModalWrapperProps) => {
  if (!isOpen) return null;

  return (
    <ClientPortal>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/50 transition-opacity">
        {/* Modal Panel: 
          - w-full on mobile, lg:w-3/4 on large screens
          - stops propagation so clicking inside doesn't close the modal
          - slides in from the right via translate-x
        */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`relative flex h-full w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:w-4/5 ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
            <Brand showText={true} />
            {/* Close Button - Top Right */}
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Modal Content - Placed below the header/close icon */}
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
