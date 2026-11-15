import { findRoute } from "../server/metro";

export default {
  fetch(request: Request) {
    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    if (!from || !to) return Response.json({ error: "from and to are required" }, { status: 400 });
    try {
      return Response.json(findRoute(from, to));
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : "Route could not be calculated" },
        { status: 400 },
      );
    }
  },
};
