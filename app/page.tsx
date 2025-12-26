import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="text-center px-4">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Finansal işlemleri platform
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Full Stack Application with .NET & Next.js
        </p>
        <Link
          href="/login"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
        >
          Go to Login
        </Link>
      </main>
    </div>
  );
}
