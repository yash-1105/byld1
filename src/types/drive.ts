export interface DriveConnection {
  id: string;
  user_id: string;
  google_account_email: string;
  created_at: string;
  updated_at: string;
}

export interface DriveFolderMapping {
  id: string;
  project_id: string;
  user_id: string;
  google_folder_id: string;
  created_at: string;
}

export interface DriveFile {
  id: string;
  user_id: string;
  project_id: string;
  google_file_id: string;
  name: string;
  mime_type: string;
  drive_link: string;
  last_synced_at: string;
  metadata_json: any;
  created_at: string;
}

export type DocumentSource = 'supabase' | 'google_drive';

export interface NormalizedDocument {
  id: string;
  name: string;
  source: DocumentSource;
  url: string;
  created_at: string;
  uploaded_by?: string;
  mime_type?: string;
  category?: string;
  visibleTo?: string[] | null;
  projectId?: string;
  approvalStatus?: string;
}
