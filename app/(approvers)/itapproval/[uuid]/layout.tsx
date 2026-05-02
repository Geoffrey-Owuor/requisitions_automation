import DashboardWrapper from "@/components/Dashboard/DashboardWrapper";

const layout = ({ children }: { children: React.ReactNode }) => {
  return <DashboardWrapper>{children}</DashboardWrapper>;
};

export default layout;
