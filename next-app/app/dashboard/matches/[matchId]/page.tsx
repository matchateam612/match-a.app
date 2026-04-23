import { MatchThreadView } from "../../_components/match-thread-view";

type DashboardMatchThreadPageProps = {
  params: Promise<{
    matchId: string;
  }>;
};

export default async function DashboardMatchThreadPage({
  params,
}: DashboardMatchThreadPageProps) {
  const { matchId } = await params;

  return <MatchThreadView matchId={matchId} />;
}
