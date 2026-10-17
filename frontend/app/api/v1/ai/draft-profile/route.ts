import { NextRequest } from "next/server";
import { POST as handleDraftProfile } from "@/app/api/ai/draft-profile/route";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  return handleDraftProfile(request);
}

