import "./globals.css";

export const metadata = {
  title: "AI Chat Starter",
  description: "Firebase Auth + Vertex AI で作るシンプルなAIチャットのスターターキット",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="antialiased text-gray-900 bg-white">
        {children}
      </body>
    </html>
  );
}
