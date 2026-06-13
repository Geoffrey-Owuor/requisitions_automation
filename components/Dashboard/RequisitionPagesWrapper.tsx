import Footer from "../Footer";

const RequisitionPagesWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="flex h-full flex-col">
      {/* Content */}
      <main className="mx-auto max-w-7xl flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export default RequisitionPagesWrapper;
