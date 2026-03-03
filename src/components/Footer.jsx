function Footer() {
  return (
    <footer style={{ borderTop: '1px solid #1e1e1e', paddingTop: '1.25rem', paddingBottom: '2rem' }}>
      <div className="w-[min(1080px,92%)] mx-auto flex items-center justify-between flex-wrap gap-2">
        <p style={{ fontSize: '0.8rem', color: '#444', letterSpacing: '0.04em' }}>
          &copy; {new Date().getFullYear()} Brett Fagan
        </p>
        <p style={{ fontSize: '0.8rem', color: '#333', letterSpacing: '0.04em' }}>
          brettlabs.dev
        </p>
      </div>
    </footer>
  );
}

export default Footer;
