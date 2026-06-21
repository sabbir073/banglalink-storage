import "./globals.css";

export const metadata = {
  title: "Banglalink Cloud — Storage for Telco Bundle",
  description: "Secure, scalable personal cloud storage demo for Banglalink mobile customers.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
