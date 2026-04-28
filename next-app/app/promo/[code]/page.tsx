import { PromoCodeClientPage } from "@/lib/promo/promo-code-client-page";

type PromoCodePageProps = {
  params: Promise<{
    code: string;
  }>;
};

export default async function PromoCodePage({ params }: PromoCodePageProps) {
  const { code } = await params;

  return <PromoCodeClientPage code={code} />;
}
