import ImageUpload from "@/components/ImageUpload";
import Link from "next/link";
import AutoAnalyze from "@/components/AutoAnalyze";

export default function Home() {
  return (
    <main className="center">
      <AutoAnalyze />
      <div className="container">
        <div style={{textAlign:"center", marginBottom:18}}>
          <h1 style={{fontSize:28, fontWeight:800, margin:0}}>SuppScan</h1>
          <p style={{margin:"8px 0 0"}} className="muted">
            Snap a supplement label to get clear, evidence-informed guidance.
          </p>
          {/* Add this navigation link */}
          <div style={{marginTop: 16}}>
            <Link href="/symptoms" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #4ade80, #22c55e)',
              color: 'white',
              textDecoration: 'none',
              padding: '10px 16px',
              borderRadius: '10px',
              fontWeight: '500',
              fontSize: '14px'
            }}>
              🩺 Manage Symptoms
            </Link>
          </div>
        </div>
        <ImageUpload />
      </div>
    </main>
  );
}