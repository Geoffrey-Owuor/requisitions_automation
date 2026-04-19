import Brand from "./Brand";

const Footer = () => {
  return (
    <footer className="relative z-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-10 sm:flex-row">
        {/* Brand */}
        <Brand />

        {/* Right */}
        <p className="text-[11px] text-[#c0a0a0]">
          © {new Date().getFullYear()} Hotpoint Appliances Ltd · Internal Use
          Only
        </p>
      </div>
    </footer>
  );
};

export default Footer;
