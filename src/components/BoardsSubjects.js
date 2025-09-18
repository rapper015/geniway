export default function BoardsSubjects() {
  const chips = [
    "CBSE", "ICSE", "State Boards", "Maths", "Science", "Social Science", "Class 6–12"
  ];

  return (
    <section className="py-8 bg-gray-50">
      <div className="max-w-md mx-auto px-4">
        <h2 className="text-xl font-semibold text-center text-gray-900 mb-6">Covers all major boards & subjects</h2>
        <div className="flex flex-wrap justify-center gap-2">
          {chips.map((chip, index) => (
            <span 
              key={index}
              className="px-3 py-2 bg-white border border-blue-200 rounded-full text-sm text-blue-600"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
