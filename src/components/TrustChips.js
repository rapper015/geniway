export default function TrustChips() {
  return (
    <section className="py-6">
      <div className="max-w-md mx-auto px-4">
        <div className="flex flex-wrap justify-center gap-3">
          <div className="px-4 py-2 bg-blue-50 text-blue-600 text-sm rounded-full border border-blue-200">
            Voice • Text • Photo
          </div>
          <div className="px-4 py-2 bg-green-50 text-green-600 text-sm rounded-full border border-green-200">
            Safe (no cheating)
          </div>
          <div className="px-4 py-2 bg-purple-50 text-purple-600 text-sm rounded-full border border-purple-200">
            Low-data mode
          </div>
        </div>
      </div>
    </section>
  );
}
