export default function HealthPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">Health Check</h1>
        <div className="bg-gray-100 p-6 rounded-lg">
          <p className="text-lg"><strong>Status:</strong> OK</p>
          <p className="text-lg"><strong>Service:</strong> Frontend</p>
          <p className="text-lg"><strong>Timestamp:</strong> {new Date().toISOString()}</p>
        </div>
      </div>
    </div>
  );
}
