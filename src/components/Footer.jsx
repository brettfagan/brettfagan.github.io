function Footer() {
  return (
    <footer
      className="pt-5 pb-8"
      style={{ borderTop: '1px solid #d4c0a8' }}
    >
      <div className="w-[min(1080px,92%)] mx-auto">
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.85rem',
            color: '#5a4a3a',
          }}
        >
          &copy; {new Date().getFullYear()} Brett Fagan. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
