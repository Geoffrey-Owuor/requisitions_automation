import Footer from "../Footer";

const RequisitionPagesWrapper = ({
  header,
  children,
}: {
  // A sticky bar above the content (RequisitionNavBar)
  header?: React.ReactNode;
  children: React.ReactNode;
}) => {
  return (
    // With a sticky header the frame must grow with its content, not stop
    // at the scroller's height, or the header scrolls away with it
    <div
      className={`flex w-full flex-col ${header ? "min-h-full shrink-0" : "h-full"}`}
    >
      {header}
      {/* Content */}
      <main className="mx-auto w-full max-w-7xl flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export default RequisitionPagesWrapper;
