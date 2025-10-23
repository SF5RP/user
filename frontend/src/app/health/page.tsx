export default function HealthPage() {
  return Response.json({ 
    status: "ok", 
    service: "frontend",
    timestamp: new Date().toISOString()
  });
}
