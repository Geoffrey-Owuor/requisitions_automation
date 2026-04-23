import DashboardHeader from "../DashboardHeader";
import Footer from "../Footer";

const DashboardWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
};

export default DashboardWrapper;
