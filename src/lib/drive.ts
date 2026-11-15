// Google Drive API integration helper using Google Identity Services (GIS) token client
// Scopes: https://www.googleapis.com/auth/drive.file

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

export interface DriveUploadResult {
  id: string;
  name: string;
  webViewLink?: string;
}

// Client ID configured via OAuth Provisioning
// When running in AI Studio, GIS client ID is injected or can be provided
export const OAUTH_SCOPES = "https://www.googleapis.com/auth/drive.file";

export async function uploadFileToGoogleDrive({
  accessToken,
  filename,
  mimeType,
  content,
}: {
  accessToken: string;
  filename: string;
  mimeType: string;
  content: string | Blob;
}): Promise<DriveUploadResult> {
  const metadata = {
    name: filename,
    mimeType: mimeType,
    description: "HAVE2WANT Master Specification v1.0 - Documento Ufficiale",
  };

  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json; charset=UTF-8" })
  );

  if (typeof content === "string") {
    form.append("file", new Blob([content], { type: mimeType }));
  } else {
    form.append("file", content);
  }

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Errore durante il caricamento su Google Drive (${res.status}): ${errText}`);
  }

  return await res.json();
}
