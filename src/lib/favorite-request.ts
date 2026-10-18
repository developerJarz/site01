export class FavoriteRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function parseFavoriteMutation(request: Request): Promise<string> {
  const origin = request.headers.get("origin");
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new FavoriteRequestError("This request must come from CarHat.", 403);
  }
  let body: unknown;
  try { body = await request.json(); }
  catch { throw new FavoriteRequestError("Please send a valid request.", 400); }
  const id = body && typeof body === "object" && "listingId" in body ? body.listingId : undefined;
  if (typeof id !== "string" || !/^[a-f\d]{24}$/i.test(id)) {
    throw new FavoriteRequestError("Choose a valid car.", 400);
  }
  return id.toLowerCase();
}
