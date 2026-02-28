function Footer() {
  return (
    <footer className="border-t border-[#dde5f3] pt-[1.2rem] pb-8 text-[#54607f]">
      <div className="w-[min(1080px,92%)] mx-auto">
        <p>&copy; {new Date().getFullYear()} Brett Fagan. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
