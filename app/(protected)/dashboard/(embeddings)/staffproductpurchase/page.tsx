import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff Product Purchase",
  description: "Staff Product Purchase Emmbedded web app",
};
const page = () => {
  return (
    <iframe
      src="https://192.0.2.11:4443/login" // Reverse proxy login page
      title="Staff Product Purchase"
      className="h-full w-full border-0 bg-white dark:bg-black"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  );
};

export default page;
