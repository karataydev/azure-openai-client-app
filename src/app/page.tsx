import dynamic from "next/dynamic";

const AzureOpenAIChat = dynamic(
  () => import("@/components/azure-openai-chat"),
  { ssr: false },
);

export default function Home() {
  return (
    <main>
      <AzureOpenAIChat />
    </main>
  );
}
