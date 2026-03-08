import Navbar from "../components/common/Navbar";
import SettingsForm from "../components/settings/SettingsForm";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-100 mb-1">
            Configure your drill
          </h1>
          <p className="text-sm text-gray-500">
            Customize operations and ranges, then hit Start
          </p>
        </div>
        <SettingsForm />
      </main>
    </div>
  );
}
