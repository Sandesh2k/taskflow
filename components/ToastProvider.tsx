"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Toast from "./Toast";

export default function ToastProvider() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [toast, setToast] = useState<{ message: string; type?: "success" | "error" | "warning" | "info" } | null>(null);
  const lastToastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const msg = searchParams.get("toast");
    const type = (searchParams.get("toastType") as "success" | "error" | "warning" | "info") || "info";

    if (!msg) {
      return;
    }

    const toastKey = `${msg}|${type}`;
    if (lastToastKeyRef.current === toastKey) {
      return;
    }

    lastToastKeyRef.current = toastKey;
    setToast({ message: msg, type });

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("toast");
    nextParams.delete("toastType");

    const newUrl = nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname;
    router.replace(newUrl);
  }, [pathname, router, searchParams]);

  return (
    <>{toast ? <Toast message={toast.message} type={toast.type} duration={6000} onClose={() => setToast(null)} /> : null}</>
  );
}
