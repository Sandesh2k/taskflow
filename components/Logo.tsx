import Image from "next/image";

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/task-management.png"
        alt="TaskFlow Logo"
        width={32}
        height={32}
        className="h-8 w-8"
      />
      <span className="text-lg font-semibold text-slate-900 dark:text-white">TaskFlow</span>
    </div>
  );
}
