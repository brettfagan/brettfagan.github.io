function Footer() {
  return (
    <footer style={{ borderTop: '1px solid #1a2233', paddingTop: '1.25rem', paddingBottom: '2rem' }}>
      <div className="w-[min(1080px,92%)] mx-auto flex items-center justify-between flex-wrap gap-2">
        <p style={{ fontSize: '0.8rem', color: '#2d3748', letterSpacing: '0.03em' }}>
          &copy; {new Date().getFullYear()} Brett Fagan
        </p>
        <p style={{ fontSize: '0.8rem', color: '#1e293b', letterSpacing: '0.03em' }}>
          brettlabs.dev
        </p>
      </div>
    </footer>
  );
}

export default Footer;
