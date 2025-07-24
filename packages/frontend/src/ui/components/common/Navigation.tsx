"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();
  
  const isActive = (path: string) => pathname === path;
  
  return (
    <nav className="bg-white border-b">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600">
            AI Chat Kit
          </Link>
          <div className="flex space-x-8">
            <Link 
              href="/simple-chat" 
              className={`${
                isActive('/simple-chat') 
                  ? 'text-blue-600 font-medium' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              シンプルチャット
            </Link>
            <Link 
              href="/ai-features" 
              className={`${
                isActive('/ai-features') 
                  ? 'text-blue-600 font-medium' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              AI機能
            </Link>
            <Link 
              href="/content-management" 
              className={`${
                isActive('/content-management') 
                  ? 'text-blue-600 font-medium' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              画像アップロード
            </Link>
            <Link 
              href="/ui-builder" 
              className={`${
                isActive('/ui-builder') 
                  ? 'text-blue-600 font-medium' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              UI生成
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}