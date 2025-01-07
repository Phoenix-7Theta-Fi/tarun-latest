import '../styles/globals.css';
import { OrderProvider } from '../context/OrderContext';
import Navbar from '../components/Navbar';

export default function App({ Component, pageProps }) {
  return (
    <OrderProvider>
      <Navbar />
      <Component {...pageProps} />
    </OrderProvider>
  );
}
