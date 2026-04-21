"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/db";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const session = await getSession();
    if (session) {
      window.location.href = "/dashboard";
    } else {
      window.location.href = "/login";
    }
  };

  return (
    <div className="loading-screen">
      Loading...
    </div>
  );
}