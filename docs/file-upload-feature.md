# File Upload Feature

## Overview

The File Upload feature allows users to upload, manage, and share project files within the CNSTRCT application. Files are stored securely in a private Supabase storage bucket with role-based access controls.

## Implementation Details

### Security Features

- **Private Storage Bucket**: All files are stored in a private Supabase bucket with Row Level Security (RLS) policies.
- **Role-Based Access Control**: Access to files is restricted based on user roles (platform admins, GC admins, project managers, and clients).
- **Signed URLs**: Temporary signed URLs are generated for file downloads, ensuring secure access to files.

### Validation and Limits

- **File Size Limit**: Maximum file size is set to 50MB.
- **File Type Validation**: Only allowed file types can be uploaded, including:
  - Documents (PDF, Word, Excel, PowerPoint, plain text, CSV)
  - Images (JPEG, PNG, GIF, SVG)
  - Archives (ZIP, RAR)
  - CAD files (DXF, DWG)

### Components and Services

#### Database

- **Table**: `project_files` stores file metadata with references to projects and uploaders.
- **RLS Policies**: Secure access controls based on user roles.

#### Backend Services

- **ProjectFileService**: Handles file operations (upload, retrieval, update, delete).
  - `uploadFile`: Validates and uploads files to storage and stores metadata in the database.
  - `getProjectFiles`: Retrieves files with uploader information and generates signed URLs.
  - `updateFileSharing`: Updates file sharing settings.
  - `deleteFile`: Removes files from storage and database.

#### React Components

- **ProjectFileUpload**: File input component with "Share with Client" option.
- **ProjectFileList**: Displays uploaded files with download links and sharing controls.
- **ProjectFiles**: Container component integrating upload and list components.

#### React Hooks

- **useProjectFiles**: Custom hook for managing project files.
  - Handles file uploads with progress indication.
  - Manages file sharing settings.
  - Retrieves signed URLs for downloads.

## Usage

### Uploading Files

```typescript
// Using the useProjectFiles hook
const { uploadFile } = useProjectFiles(projectId);

// Upload a file and optionally share with client
uploadFile(fileObject, shareWithClient);
```

### Retrieving Files

```typescript
// Using the useProjectFiles hook
const { files, clientSharedFiles } = useProjectFiles(projectId);

// Access all files or only those shared with clients
console.log(files); // All files
console.log(clientSharedFiles); // Files shared with clients
```

### Downloading Files

```typescript
// Using the useProjectFiles hook
const { getSignedFileUrl } = useProjectFiles(projectId);

// Get a signed URL for downloading a file
const url = await getSignedFileUrl(fileId);
window.open(url, '_blank');
```

### Updating File Sharing Settings

```typescript
// Using the useProjectFiles hook
const { updateFileSharing } = useProjectFiles(projectId);

// Update sharing settings
updateFileSharing(fileId, shareWithClient);
```

### Deleting Files

```typescript
// Using the useProjectFiles hook
const { deleteFile } = useProjectFiles(projectId);

// Delete a file
deleteFile(fileId);
```

## Error Handling

The file upload feature includes comprehensive error handling:

- File size and type validation errors
- Storage upload failures
- Database operation errors
- Authentication and permission errors
- File access errors

All errors are properly returned with descriptive messages for a better user experience.
