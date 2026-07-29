"use client";

import { FileSpreadsheet } from "lucide-react";
import { useState } from "react";

const ITDataExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  // Document name
  const documentName = `it_requisitions_${new Date().toLocaleDateString("en-GB")}`;

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const response = await fetch("/api/itrequisition/requisitions-export", {
        method: "GET",
      });

      if (!response.ok) throw new Error("Download Failed");

      // Generate a blob from the buffer response
      const blob = await response.blob();

      // Creating a temporary url for the blob
      const url = window.URL.createObjectURL(blob);

      // Creating a temporary link element to trigger the download
      const a = document.createElement("a");
      a.href = url;
      a.download = documentName; //file name for the downloaded file
      document.body.appendChild(a);
      a.click(); //click the link programmatically to start the download
      a.remove(); //remove link from the body;
      window.URL.revokeObjectURL(url); //cleanup the temporary url
    } catch (error) {
      console.error(
        "Error while trying to export the IT Requisitions data:",
        error,
      );
    } finally {
      setIsExporting(false);
    }
  };
  return (
    <div className="relative inline-flex items-center justify-center p-1.5">
      {/* Spinning border with a visible track */}
      {isExporting && (
        <div className="absolute inset-0 animate-spin rounded-full border border-neutral-200 border-t-black" />
      )}

      {/* Download button */}
      <button
        title="Export data"
        onClick={handleExport}
        disabled={isExporting}
        className="relative z-10 rounded-xl border border-neutral-300 bg-neutral-200/50 p-2.5 transition-colors duration-200 hover:bg-neutral-200/80"
      >
        <FileSpreadsheet className="h-4.5 w-4.5" />
      </button>
    </div>
  );
};

export default ITDataExport;
