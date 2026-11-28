import type { FeatureCollection, LineString } from "geojson";

export type FutureLineProperties = {
  id: string;
  name: string;
  color: string;
  status: string;
  route: string;
};

export const futureNetwork: FeatureCollection<LineString, FutureLineProperties> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "pink-underground",
        name: "Pink Line · underground extension",
        color: "#e84393",
        status: "Under construction",
        route: "S.G. Palya to Nagawara",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [77.6005, 12.9294], [77.5965, 12.9387], [77.5944, 12.9484], [77.6005, 12.9720],
          [77.6036, 12.9782], [77.5949, 12.9898], [77.6087, 12.9932], [77.6135, 13.0030],
          [77.6158, 13.0134], [77.6172, 13.0247], [77.6193, 13.0354], [77.6227, 13.0436],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "blue-line",
        name: "Blue Line",
        color: "#1678d3",
        status: "Under construction",
        route: "Central Silk Board to Kempegowda International Airport",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [77.6235, 12.9177], [77.6380, 12.9123], [77.6550, 12.9242], [77.6675, 12.9270],
          [77.6784, 12.9350], [77.6915, 12.9437], [77.6990, 12.9548], [77.7057, 12.9660],
          [77.6974, 12.9782], [77.6952, 12.9918], [77.6819, 12.9980], [77.6663, 13.0007],
          [77.6470, 13.0068], [77.6385, 13.0192], [77.6306, 13.0313], [77.6227, 13.0436],
          [77.6135, 13.0543], [77.6004, 13.0712], [77.5929, 13.0863], [77.5937, 13.1012],
          [77.5963, 13.1215], [77.5943, 13.1437], [77.6071, 13.1650], [77.6202, 13.1782],
          [77.6674, 13.1848], [77.6975, 13.1989], [77.7066, 13.1986],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "phase-3-orr-west",
        name: "Phase 3 · ORR West",
        color: "#ef7d32",
        status: "Sanctioned · preliminary works",
        route: "JP Nagar 4th Phase to Kempapura",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [77.5852, 12.9074], [77.5795, 12.9165], [77.5732, 12.9250], [77.5654, 12.9363],
          [77.5548, 12.9450], [77.5454, 12.9528], [77.5336, 12.9570], [77.5199, 12.9566],
          [77.5074, 12.9665], [77.4935, 12.9787], [77.4859, 12.9903], [77.4788, 13.0030],
          [77.4861, 13.0193], [77.4965, 13.0308], [77.5098, 13.0389], [77.5227, 13.0452],
          [77.5320, 13.0518], [77.5487, 13.0557], [77.5645, 13.0589], [77.5827, 13.0646],
          [77.5977, 13.0735], [77.6135, 13.0543],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "phase-3-magadi",
        name: "Phase 3 · Magadi Road",
        color: "#667085",
        status: "Sanctioned · preliminary works",
        route: "Hosahalli to Kadabagere",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [77.5451, 12.9741], [77.5298, 12.9820], [77.5135, 12.9926], [77.4965, 13.0042],
          [77.4804, 13.0130], [77.4617, 13.0170], [77.4432, 13.0208], [77.4257, 13.0227],
          [77.4062, 13.0245],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "proposed-red",
        name: "Proposed Red Line",
        color: "#d63b3b",
        status: "Draft alignment · approvals pending",
        route: "Sarjapur to Hebbal",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [77.7851, 12.8605], [77.7603, 12.8755], [77.7394, 12.8882], [77.7180, 12.8998],
          [77.6996, 12.9120], [77.6856, 12.9244], [77.6700, 12.9335], [77.6500, 12.9348],
          [77.6330, 12.9344], [77.6195, 12.9388], [77.6047, 12.9454], [77.5965, 12.9562],
          [77.5908, 12.9690], [77.5855, 12.9814], [77.5814, 12.9942], [77.5828, 13.0095],
          [77.5848, 13.0235], [77.5899, 13.0377], [77.5941, 13.0534], [77.5977, 13.0735],
        ],
      },
    },
  ],
};
