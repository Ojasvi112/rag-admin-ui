// pages/_app.js
import "../styles/globals.css"; // ← global CSS for Next.js
export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
