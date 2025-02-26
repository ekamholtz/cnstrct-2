
export function ProjectNotFound() {
  return (
    <div className="flex justify-center items-center h-full">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Project Not Found</h2>
        <p className="text-gray-600">
          The project you are looking for does not exist or you do not have permission to view it.
        </p>
      </div>
    </div>
  );
}
