export default function Home(): React.ReactNode {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="container-base py-12 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
            Welcome to Toys for Toys
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            The Eco-Friendly, Cashless Toy Exchange Platform. Give a toy, get a ticket, take a toy.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <button className="btn-primary">
              Get Started
            </button>
            <button className="btn-secondary">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
