import Footer from "../Footer";

const RequisitionPagesWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="flex h-full flex-col">
      {/* Content */}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export default RequisitionPagesWrapper;
