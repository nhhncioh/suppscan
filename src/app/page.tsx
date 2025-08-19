import ImageUpload from "@/components/ImageUpload";

export default function Home() {
  return (
    <main className="center">
      <div className="container">
        <div style={{textAlign:"center", marginBottom:18}}>
          <h1 style={{fontSize:28, fontWeight:800, margin:0}}>SuppScan</h1>
          <p style={{margin:"8px 0 0"}} className="muted">
            Snap a supplement label to get clear, evidence-informed guidance.
          </p>
        </div>
        <ImageUpload />
      </div>
    </main>
  );
}
