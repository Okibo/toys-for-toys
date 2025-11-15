import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Toy-for-Toy - Cashless Toy Exchange Platform</title>
        <meta
          name="description"
          content="Exchange toys with other families using tickets. No money involved!"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16 lg:py-20">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
              Toy-for-Toy
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              A cashless toy exchange platform for families
            </p>
            <p className="text-lg text-gray-500 mb-12">
              Exchange toys with other families using our ticket-based economy system
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Fair Exchange
                </h2>
                <p className="text-gray-600">
                  1 toy = 1 ticket. Simple, transparent, and fair for everyone
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  No Money
                </h2>
                <p className="text-gray-600">
                  Keep your wallet closed. Everything is ticket-based
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Community
                </h2>
                <p className="text-gray-600">
                  Join families sharing and exchanging toys in your area
                </p>
              </div>
            </div>

            <div className="mt-12">
              <p className="text-sm text-gray-500">
                Application is currently in development
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
