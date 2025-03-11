
interface ClientPageHeaderProps {
  pageTitle: string;
  pageDescription?: string;
}

export function ClientPageHeader({ pageTitle, pageDescription }: ClientPageHeaderProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
      <h1 className="text-2xl font-bold text-[#172b70] mb-2">
        {pageTitle}
      </h1>
      {pageDescription && (
        <div className="flex items-center text-gray-600">
          <span>{pageDescription}</span>
        </div>
      )}
    </div>
  );
}
