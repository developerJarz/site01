import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Blog } from "@/lib/models/Blog";

export const dynamic = "force-dynamic";

// GET all blogs (admin sees all, public sees published only)
export async function GET(req: NextRequest) {
  try {
    const all = req.nextUrl.searchParams.get("all");
    await connectToDatabase();
    const filter = all === "true" ? {} : { published: true };
    const blogs = await Blog.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ blogs: JSON.parse(JSON.stringify(blogs)) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - create new blog (admin only)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await connectToDatabase();

    const slug =
      body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
      "-" +
      Date.now().toString(36);

    const blog = await Blog.create({ ...body, slug });
    return NextResponse.json({ success: true, blog }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - update blog
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...update } = body;
    await connectToDatabase();
    await Blog.findByIdAndUpdate(id, update);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await connectToDatabase();
    await Blog.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
