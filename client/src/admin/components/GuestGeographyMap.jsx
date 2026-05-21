import React from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Mock data for guests
const markers = [
  { markerOffset: -15, name: "Mumbai", coordinates: [72.8777, 19.0760] },
  { markerOffset: -15, name: "Delhi", coordinates: [77.2090, 28.6139] },
  { markerOffset: 15, name: "Bengaluru", coordinates: [77.5946, 12.9716] },
  { markerOffset: 15, name: "Hyderabad", coordinates: [78.4867, 17.3850] },
  { markerOffset: -15, name: "London", coordinates: [-0.1276, 51.5072] },
  { markerOffset: -15, name: "Dubai", coordinates: [55.2708, 25.2048] },
  { markerOffset: 15, name: "Singapore", coordinates: [103.8198, 1.3521] },
];

const GuestGeographyMap = () => {
  return (
    <div style={{ width: "100%", height: "100%", minHeight: 300, display: "flex", flexDirection: "column" }}>
      <ComposableMap
        projectionConfig={{ scale: 140 }}
        style={{ width: "100%", height: "auto", flex: 1 }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="rgba(201,168,76,0.15)"
                stroke="rgba(201,168,76,0.3)"
                strokeWidth={0.5}
                style={{
                  default: { outline: "none" },
                  hover: { fill: "rgba(201,168,76,0.3)", outline: "none" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>
        {markers.map(({ name, coordinates, markerOffset }) => (
          <Marker key={name} coordinates={coordinates}>
            <circle r={4} fill="#c9a84c" stroke="#fff" strokeWidth={1.5} />
            <text
              textAnchor="middle"
              y={markerOffset}
              style={{ fontFamily: "system-ui", fill: "#5a5a5a", fontSize: "10px", fontWeight: 600 }}
            >
              {name}
            </text>
          </Marker>
        ))}
      </ComposableMap>
    </div>
  );
};

export default GuestGeographyMap;
