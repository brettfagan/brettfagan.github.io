function Footer() {
  return (
    <footer className="border-t border-[#dde5f3] dark:border-border pt-[1.2rem] pb-8 text-[#54607f] dark:text-muted-foreground">
      <div className="w-[min(1080px,92%)] mx-auto">
        <p>
          &copy; {new Date().getFullYear()} Brett Fagan. All rights reserved.
          {' · '}
          <a href="/privacy" className="hover:underline">Privacy Policy</a>
          {' · '}
          <a href="/terms" className="hover:underline">Terms of Service</a>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
