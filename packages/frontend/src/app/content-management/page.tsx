import { Metadata } from "next";
import ContentManagementPage from "./ContentManagementPage";

export const metadata: Metadata = {
  title: "コンテンツ管理 - AI Chat Starter Kit",
  description: "画像やファイルのアップロード・管理を行います",
};

export default function Page() {
  return <ContentManagementPage />;
}