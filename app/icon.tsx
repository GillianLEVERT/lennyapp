import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          alignItems: "center",
          justifyContent: "center",
          background: "#15254B",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 32,
            left: 42,
            width: 180,
            height: 180,
            borderRadius: 9999,
            background: "#FF4D63",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 62,
            right: 36,
            width: 170,
            height: 170,
            borderRadius: 9999,
            background: "#FFD447",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 34,
            left: 70,
            width: 240,
            height: 240,
            borderRadius: 9999,
            background: "#2E5BFF",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            width: 300,
            height: 300,
            borderRadius: 90,
            alignItems: "center",
            justifyContent: "center",
            background: "#F8FBFF",
            boxShadow: "0 0 0 18px rgba(255,255,255,0.16)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 220,
              height: 220,
              borderRadius: 70,
              background: "#2E5BFF",
              color: "#FFFFFF",
              fontSize: 154,
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            L
          </div>
        </div>
      </div>
    ),
    size
  );
}
