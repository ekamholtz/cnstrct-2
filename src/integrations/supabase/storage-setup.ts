import { supabase } from './client';

/**
 * Ensures that the project-files storage bucket exists and is properly configured
 * This is a development utility and should be replaced with proper migrations in production
 */
export const setupProjectFilesStorage = async (): Promise<void> => {
  try {
    console.log('Setting up project-files storage bucket...');
    
    // Check if the bucket exists
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
      
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }
    
    const projectFilesBucket = buckets?.find(bucket => bucket.name === 'project-files');
    
    // Create the bucket if it doesn't exist
    if (!projectFilesBucket) {
      console.log('Creating project-files bucket...');
      const { error: createError } = await supabase
        .storage
        .createBucket('project-files', {
          public: true, // Make the bucket public for development
          fileSizeLimit: 50 * 1024 * 1024 // 50MB limit
        });
        
      if (createError) {
        console.error('Error creating bucket:', createError);
        return;
      }
      
      console.log('project-files bucket created successfully');
    } else {
      console.log('project-files bucket already exists');
      
      // Update the bucket to be public if it's not already
      if (!projectFilesBucket.public) {
        console.log('Updating project-files bucket to be public...');
        const { error: updateError } = await supabase
          .storage
          .updateBucket('project-files', {
            public: true
          });
          
        if (updateError) {
          console.error('Error updating bucket:', updateError);
          return;
        }
        
        console.log('project-files bucket updated to be public');
      }
    }
    
    console.log('Storage setup completed successfully');
  } catch (error) {
    console.error('Unexpected error in setupProjectFilesStorage:', error);
  }
};
