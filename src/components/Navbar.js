import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="bg-gray-900 shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between">
          <div className="flex space-x-7">
            <div>
              <Link href="/" className="flex items-center py-4 px-2">
                <span className="font-semibold text-gray-100 text-lg">
                  Bio App
                </span>
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-1">
              <Link href="/" className="py-4 px-2 text-gray-300 font-semibold hover:text-green-400 transition duration-300">
                Home
              </Link>
              <Link href="/order-processing" className="py-4 px-2 text-gray-300 font-semibold hover:text-green-400 transition duration-300">
                Orders
              </Link>
              <Link href="/status" className="py-4 px-2 text-gray-300 font-semibold hover:text-green-400 transition duration-300">
                Status
              </Link>
              <Link href="/order-management" className="py-4 px-2 text-gray-300 font-semibold hover:text-green-400 transition duration-300">
                Manage Orders
              </Link>
              <Link href="/inventory" className="py-4 px-2 text-gray-300 font-semibold hover:text-green-400 transition duration-300">
                Inventory
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
