import ImageUpload from "@/components/ImageUpload";

export default function Home() {
  return (
    <main style={{ display: "grid", placeItems: "center", minHeight: "100dvh", padding: 24 }}>
      <div style={{ textAlign: "center", fontFamily: "system-ui, sans-serif", width: "100%", maxWidth: 720 }}>
        <h1>SuppScan</h1>
        <p style={{ opacity: 0.8 }}>Step 2 — Upload an image (no OCR/model yet)</p>
        <ImageUpload />
      </div>
    </main>
  );
}
