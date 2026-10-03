import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSafeSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

async function updateProfile(formData: FormData) {
  "use server";

  const session = await getSafeSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return;
  }

  await connectToDatabase();
  await User.findByIdAndUpdate(session.user.id, { name });

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export default async function ProfilePage() {
  const session = await getSafeSession();

  if (!session?.user) {
    redirect("/login");
  }

  await connectToDatabase();
  const currentUser = await User.findById(session.user.id).lean();

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-800">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Profile</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Update your account</h1>
          </div>
          <a
            href="/dashboard"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Back to dashboard
          </a>
        </div>

        <form action={updateProfile} className="space-y-5">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
              Full name
            </label>
            <input
              id="name"
              name="name"
              defaultValue={String(currentUser?.name ?? session.user.name ?? "")}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
              placeholder="Jane Doe"
              required
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            <p className="font-medium text-slate-700">Email</p>
            <p className="mt-1">{session.user.email}</p>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Save profile
          </button>
        </form>
      </div>
    </main>
  );
}
