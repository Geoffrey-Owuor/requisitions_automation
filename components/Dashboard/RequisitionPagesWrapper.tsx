import Footer from "../Footer";

const RequisitionPagesWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="flex h-full w-full flex-col">
      {/* Content */}
      <main className="mx-auto w-full max-w-7xl flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export default RequisitionPagesWrapper;
