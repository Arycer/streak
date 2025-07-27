import { Link } from "@heroui/link";
import React from "react";

import { Navbar } from "@/components/navbar";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Navbar />
      <main className="container mx-auto max-w-7xl px-6 flex-grow pt-16">
        {children}
      </main>
      <footer className="w-full flex items-center justify-center py-4 backdrop-blur-md bg-gradient-to-r from-purple-100/90 to-pink-100/90 supports-[backdrop-filter]:bg-gradient-to-r supports-[backdrop-filter]:from-purple-100/90 supports-[backdrop-filter]:to-pink-100/90 z-50 border border-purple-300/60 shadow-lg">
        <Link
          isExternal
          className="flex items-center gap-1 text-current hover:text-purple-600 transition-colors duration-300"
          href="https://arycer.me"
          title="Arycer portfolio"
        >
          <span className="text-gray-600 font-medium">Made with ❤️ by Arycer</span>
        </Link>
      </footer>
    </div>
  );
}
