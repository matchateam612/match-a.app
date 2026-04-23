import { ThreadView } from "../../_components/thread-view";

type DashboardThreadPageProps = {
  params: Promise<{
    threadId: string;
  }>;
};

export default async function DashboardThreadPage({
  params,
}: DashboardThreadPageProps) {
  const { threadId } = await params;

  return <ThreadView threadId={threadId} />;
}
