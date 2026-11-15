import { network } from "../server/metro";

export default {
  fetch() {
    return Response.json(network, {
      headers: { "Cache-Control": "public, max-age=300, s-maxage=86400" },
    });
  },
};
