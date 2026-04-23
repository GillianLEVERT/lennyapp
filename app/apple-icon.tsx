import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #2E5BFF 0%, #1E35A5 100%)",
          borderRadius: 48,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -18,
            right: -8,
            width: 70,
            height: 70,
            borderRadius: 9999,
            background: "rgba(255, 212, 71, 0.9)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -12,
            left: -10,
            width: 74,
            height: 74,
            borderRadius: 9999,
            background: "rgba(255, 77, 99, 0.88)",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 108,
            height: 108,
            borderRadius: 34,
            background: "#F8FBFF",
            color: "#15254B",
            fontSize: 72,
            fontWeight: 900,
          }}
        >
          L
        </div>
      </div>
    ),
    size
  );
}
