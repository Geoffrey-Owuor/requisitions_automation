// A reusable createPortal function to solve server side document is not defined errors
"use client";

import { createPortal } from "react-dom";
import { useState, useEffect } from "react";

type ClientPortalProps = {
  children: React.ReactNode;
  selector?: string;
};

const ClientPortal = ({ children, selector = "body" }: ClientPortalProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => setMounted(true));
  }, []);

  //   Check if mounted
  if (!mounted) {
    return null;
  }

  // Ensure document is available (extra safety for some edge case environments)
  const container =
    typeof document !== "undefined" ? document.querySelector(selector) : null;

  return container ? createPortal(children, container) : null;
};

export default ClientPortal;
