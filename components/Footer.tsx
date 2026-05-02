const Footer = () => {
  return (
    <footer className="relative z-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-6 px-6 py-10 sm:flex-row">
        {/* Right */}
        <p className="text-[13px] text-slate-500">
          © {new Date().getFullYear()} Hotpoint Appliances Ltd · Internal Use
          Only
        </p>
      </div>
    </footer>
  );
};

export default Footer;
