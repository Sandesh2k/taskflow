export const runtime = "nodejs";

import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { apiError } from "@/lib/http";
import { signUpSchema } from "@/lib/validators";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input.", 400);
    }

    await connectToDatabase();

    const email = parsed.data.email.toLowerCase();
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return apiError("USER_EXISTS", "An account with this email already exists.", 409);
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await User.create({
      name: parsed.data.name.trim(),
      email,
      passwordHash,
    });

    return Response.json(
      {
        success: true,
        message: "Account created successfully.",
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Register error:", error);
    return apiError("REGISTRATION_FAILED", "Unable to create your account right now.", 500);
  }
}
