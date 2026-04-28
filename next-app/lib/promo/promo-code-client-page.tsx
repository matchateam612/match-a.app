"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { savePromoCode } from "./promo-code";

type PromoCodeClientPageProps = {
  code: string;
};

export function PromoCodeClientPage({ code }: PromoCodeClientPageProps) {
  const router = useRouter();

  useEffect(() => {
    let isActive = true;

    async function storePromoAndRedirect() {
      try {
        await savePromoCode(code);
      } finally {
        if (isActive) {
          router.replace("/signup");
        }
      }
    }

    void storePromoAndRedirect();

    return () => {
      isActive = false;
    };
  }, [code, router]);

  return null;
}
