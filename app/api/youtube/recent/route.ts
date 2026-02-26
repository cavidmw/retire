import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID || process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID;

  if (!apiKey || !channelId) {
    return NextResponse.json(
      { error: "Missing YOUTUBE_API_KEY or YOUTUBE_CHANNEL_ID" },
      { status: 500 }
    );
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("channelId", channelId);
  url.searchParams.set("maxResults", "16");
  url.searchParams.set("order", "date");
  url.searchParams.set("type", "video");
  url.searchParams.set("key", apiKey);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: "YouTube API error", details: text }, { status: 502 });
    }
    const data = await res.json();
    const items = (data?.items || []).map((item: any) => ({
      id: item.id?.videoId || item.etag,
      title: item.snippet?.title || "",
      thumbnail:
        item.snippet?.thumbnails?.medium?.url ||
        item.snippet?.thumbnails?.default?.url ||
        "",
      url: item.id?.videoId ? `https://www.youtube.com/watch?v=${item.id.videoId}` : "",
    }));
    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json({ error: "Fetch failed", details: String(err) }, { status: 500 });
  }
}
