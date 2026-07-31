import SalaryAdvancePage from "@/components/SalaryAdvance/SalaryAdvancePage";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hotpoint Salary Advance",
  description: "Hotpoint salary advance page",
};

const page = () => {
  return (
    <div className="layout-scrollbar relative flex h-screen flex-col bg-[#fafafa] text-slate-900 selection:bg-rose-100 selection:text-rose-900">
      <Header />
      <div className="flex-1">
        <SalaryAdvancePage />
      </div>
      <Footer />
    </div>
  );
};

export default page;
