import "./globals.css";
import Navbar from "./components/Navbar";
import SessionProvider from "./components/SessionProvider";

export const metadata = {
  title: "Meal Planner",
  description: "Plan your meals",
};

export default function RootLayout({ children }) {
  return (
    <SessionProvider>
      <html lang="en">
        <body>
          <Navbar />
          {children}
        </body>
      </html>
    </SessionProvider>

  );
}