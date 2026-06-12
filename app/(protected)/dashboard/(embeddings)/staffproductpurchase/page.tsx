import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff Product Purchase",
  description: "Staff Product Purchase Emmbedded web app",
};
const page = () => {
  return (
    <iframe
      src="http://192.168.0.27:10556" // Replace with your app's URL
      title="Staff Product Purchase"
      className="h-full w-full border-0 bg-white dark:bg-black"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      allow="clipboard-read; clipboard-write" // Add permissions if your app needs them
    />
  );
};

export default page;
