import { NextRequest, NextResponse } from "next/server";

function memoryBaseUrl(): string {
  const url = process.env.FORM_MEMORY_URL?.replace(/\/$/, "");
  if (!url) {
    throw new Error("FORM_MEMORY_URL is not configured");
  }
  return url;
}

function memoryApiKey(): string {
  const key = process.env.FORM_MEMORY_API_KEY?.trim();
  if (!key) {
    throw new Error("FORM_MEMORY_API_KEY is not configured");
  }
  return key;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest("GET", context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const body = await request.text();
  return proxyRequest("POST", context, body);
}

async function proxyRequest(
  method: "GET" | "POST",
  context: { params: Promise<{ path: string[] }> },
  body?: string,
) {
  try {
    const { path } = await context.params;
    const suffix = path?.length ? `/${path.join("/")}` : "";
    const response = await fetch(`${memoryBaseUrl()}${suffix}`, {
      method,
      headers: {
        Authorization: `Bearer ${memoryApiKey()}`,
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(process.env.FORM_MEMORY_WORKSPACE_ID
          ? { "X-Form-Workspace": process.env.FORM_MEMORY_WORKSPACE_ID }
          : {}),
      },
      body,
    });

    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Memory proxy failed",
      },
      { status: 503 },
    );
  }
}
