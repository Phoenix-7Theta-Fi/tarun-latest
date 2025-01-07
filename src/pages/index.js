import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-50">
      <div className="text-center p-8 bg-white shadow-xl rounded-xl">
        <h1 className="text-4xl font-bold mb-6 text-green-800">
          Fertilizer Order Processing
        </h1>
        <p className="mb-8 text-gray-600">
          Welcome to our internal order management system
        </p>
        <div className="flex space-x-4 justify-center">
          <Link 
            href="/order-processing"
            className="bg-green-600 text-white px-6 py-3 rounded-full 
            hover:bg-green-700 transition-colors text-xl font-semibold"
          >
            Enter Order Processing
          </Link>
          <Link 
            href="/status"
            className="bg-blue-600 text-white px-6 py-3 rounded-full 
            hover:bg-blue-700 transition-colors text-xl font-semibold"
          >
            View Order Status
          </Link>
        </div>
      </div>
    </div>
  );
}
