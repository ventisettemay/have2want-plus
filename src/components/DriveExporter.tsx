import React, { useState } from "react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  CloudUpload,
  CheckCircle2,
  AlertCircle,
  FileDown,
  Download,
  Printer,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Loader2,
  FolderSync
} from "lucide-react";
import { uploadFileToGoogleDrive } from "../lib/drive";
import firebaseConfig from "../../firebase-applet-config.json";

interface DriveExporterProps {
  documentTitle: string;
  markdownContent: string;
  userEmail?: string;
}

export const DriveExporter: React.FC<DriveExporterProps> = ({
  documentTitle,
  markdownContent,
  userEmail = "",
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "authorizing" | "uploading" | "success" | "error">("idle");
  const [uploadMessage, setUploadMessage] = useState<string>("");
  const [uploadedLink, setUploadedLink] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<"pdf" | "md" | "html">("pdf");
  const [showManualTokenPanel, setShowManualTokenPanel] = useState(false);
  const [manualTokenInput, setManualTokenInput] = useState("");

  // Client-side Direct PDF Download generator using jsPDF
  const generateDirectPdfBlob = async (): Promise<Blob> => {
    const docElement = document.getElementById("printable-master-document");
    if (!docElement) {
      // Fallback text-based PDF
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const splitText = pdf.splitTextToSize(markdownContent, 500);
      pdf.text(splitText, 40, 50);
      return pdf.output("blob");
    }

    // Capture render
    const canvas = await html2canvas(docElement, {
      scale: 1.5,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [canvas.width, canvas.height],
    });

    pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
    return pdf.output("blob");
  };

  // 1. Direct PDF Download to Computer
  const handleDownloadDirectPdf = async () => {
    try {
      setIsExportingPdf(true);
      const blob = await generateDirectPdfBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${documentTitle}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error("Errore generazione PDF: " + (err?.message || "Errore sconosciuto"));
    } finally {
      setIsExportingPdf(false);
    }
  };

  // 2. Direct 1-Click Upload to Google Drive
  const handleDirectGoogleDriveUpload = async () => {
    setUploadStatus("authorizing");
    setUploadMessage("Richiesta autorizzazione Google Drive...");
    setUploadedLink(null);

    // If we have GIS token client available in window
    const clientId =
      (import.meta as any).env?.VITE_GOOGLE_OAUTH_CLIENT_ID ||
      firebaseConfig.oAuthClientId ||
      "";
    if (typeof window !== "undefined" && window.google?.accounts?.oauth2 && clientId) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "https://www.googleapis.com/auth/drive.file",
          callback: async (resp) => {
            if (resp.error) {
              setUploadStatus("error");
              setUploadMessage("Autorizzazione annullata o non riuscita: " + resp.error);
              return;
            }
            if (resp.access_token) {
              setDriveAccessToken(resp.access_token);
              setShowManualTokenPanel(false);
              await performUpload(resp.access_token);
            }
          },
        });
        client.requestAccessToken({ prompt: "consent" });
      } catch {
        fallbackUploadWorkflow();
      }
    } else {
      fallbackUploadWorkflow();
    }
  };

  const fallbackUploadWorkflow = () => {
    setUploadStatus("idle");
    setShowManualTokenPanel(true);
  };

  const performUpload = async (token: string) => {
    try {
      setUploadStatus("uploading");
      setUploadMessage("Creazione pacchetto documentale e caricamento su Google Drive in corso...");

      let fileBlob: Blob;
      let filename = `${documentTitle}`;
      let mimeType = "application/pdf";

      if (exportFormat === "pdf") {
        fileBlob = await generateDirectPdfBlob();
        filename += ".pdf";
        mimeType = "application/pdf";
      } else if (exportFormat === "md") {
        fileBlob = new Blob([markdownContent], { type: "text/markdown;charset=utf-8" });
        filename += ".md";
        mimeType = "text/markdown";
      } else {
        const htmlContent = document.getElementById("printable-master-document")?.outerHTML || markdownContent;
        fileBlob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
        filename += ".html";
        mimeType = "text/html";
      }

      const result = await uploadFileToGoogleDrive({
        accessToken: token,
        filename,
        mimeType,
        content: fileBlob,
      });

      setUploadStatus("success");
      setUploadMessage(`File caricato con successo in Google Drive con ID: ${result.id}`);
      if (result.webViewLink) {
        setUploadedLink(result.webViewLink);
      } else {
        setUploadedLink(`https://drive.google.com/file/d/${result.id}/view`);
      }
    } catch (error: any) {
      setUploadStatus("error");
      setUploadMessage("Errore caricamento: " + (error?.message || "Impossibile completare l'upload"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Primary Google Drive 1-Click Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/40 border border-blue-500/30 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
              <CloudUpload className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">Salvataggio Diretto su Google Drive</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> OAuth 2.0 Abilitato
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Account collegato: <span className="text-slate-200 font-mono">{userEmail}</span>
              </p>
            </div>
          </div>

          {/* Format selection */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setExportFormat("pdf")}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                exportFormat === "pdf" ? "bg-amber-500 text-slate-950 font-bold shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              PDF Ufficiale
            </button>
            <button
              onClick={() => setExportFormat("md")}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                exportFormat === "md" ? "bg-amber-500 text-slate-950 font-bold shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Markdown (.md)
            </button>
            <button
              onClick={() => setExportFormat("html")}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                exportFormat === "html" ? "bg-amber-500 text-slate-950 font-bold shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              HTML Web
            </button>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-5">
          {/* Button 1: 1-Click Upload to Google Drive */}
          <button
            onClick={handleDirectGoogleDriveUpload}
            disabled={uploadStatus === "authorizing" || uploadStatus === "uploading"}
            id="gdrive-direct-upload-btn"
            className="p-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-left font-medium transition-all shadow-lg shadow-blue-600/20 cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <CloudUpload className="w-5 h-5 text-blue-200" />
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
                Cloud
              </span>
            </div>
            <div>
              <div className="font-semibold text-sm">Carica su Google Drive</div>
              <div className="text-[11px] text-blue-100/80">Salva direttamente nel tuo Drive</div>
            </div>
          </button>

          {/* Button 2: Direct PDF download */}
          <button
            onClick={handleDownloadDirectPdf}
            disabled={isExportingPdf}
            id="download-direct-pdf-btn"
            className="p-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-amber-500/50 text-left font-medium transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              {isExportingPdf ? (
                <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
              ) : (
                <FileDown className="w-5 h-5 text-amber-400" />
              )}
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded">
                {isExportingPdf ? "Generazione..." : "PDF"}
              </span>
            </div>
            <div>
              <div className="font-semibold text-sm text-slate-100">Scarica PDF sul Computer</div>
              <div className="text-[11px] text-slate-400">Download file locale ad alta fedeltà</div>
            </div>
          </button>

          {/* Button 3: Browser Print to Google Drive */}
          <button
            onClick={() => window.print()}
            id="browser-print-gdrive-btn"
            className="p-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-left font-medium transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <Printer className="w-5 h-5 text-slate-300" />
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                Stampa
              </span>
            </div>
            <div>
              <div className="font-semibold text-sm text-slate-100">Stampa / Salva con Chrome</div>
              <div className="text-[11px] text-slate-400">Destinazione: "Salva su Google Drive"</div>
            </div>
          </button>
        </div>

        {/* Inline Manual OAuth Token Panel (when GIS popup is blocked inside iframe) */}
        {showManualTokenPanel && (
          <div className="mt-4 p-3.5 rounded-xl bg-slate-950/90 border border-slate-700 space-y-2 text-xs">
            <div className="font-semibold text-amber-300">
              Popup OAuth bloccato o non disponibile in questo frame
            </div>
            <p className="text-slate-400">
              Puoi scaricare il PDF localmente oppure inserire manualmente un Google OAuth Access Token (<code className="text-slate-300">drive.file</code>):
            </p>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={manualTokenInput}
                onChange={(e) => setManualTokenInput(e.target.value)}
                placeholder="Incolla Access Token OAuth 2.0..."
                className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={async () => {
                  const trimmed = manualTokenInput.trim();
                  if (!trimmed) return;
                  setShowManualTokenPanel(false);
                  await performUpload(trimmed);
                }}
                className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer"
              >
                Carica
              </button>
              <button
                type="button"
                onClick={() => setShowManualTokenPanel(false)}
                className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
              >
                Annulla
              </button>
            </div>
          </div>
        )}

        {/* Upload Status Notification */}
        {uploadStatus !== "idle" && (
          <div
            className={`mt-4 p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
              uploadStatus === "uploading" || uploadStatus === "authorizing"
                ? "bg-blue-950/50 border-blue-800 text-blue-200"
                : uploadStatus === "success"
                ? "bg-emerald-950/50 border-emerald-800 text-emerald-200"
                : "bg-rose-950/50 border-rose-800 text-rose-200"
            }`}
          >
            {uploadStatus === "uploading" || uploadStatus === "authorizing" ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-0.5" />
            ) : uploadStatus === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="font-semibold">{uploadMessage}</div>
              {uploadedLink && (
                <a
                  href={uploadedLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 font-bold text-amber-300 underline hover:text-amber-200"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Apri il file appena caricato in Google Drive
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Guide Card: How to use Google Drive Step-by-Step */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <FolderSync className="w-4 h-4 text-amber-400" />
          I 3 Modi Rapidi per Salvare la Documentazione in Drive
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="font-bold text-amber-400 mb-1">1. Click su "Scarica PDF"</div>
            <p className="text-slate-400 mb-2">
              Clicca su <strong>"Scarica PDF sul Computer"</strong>. Il file PDF completo di tabelle e firme viene generato e salvato nella cartella Download del tuo computer.
            </p>
            <p className="text-slate-400">
              Poi trascinalo nella cartella di <a href="https://drive.google.com" target="_blank" rel="noreferrer" className="text-blue-400 underline">Google Drive</a>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="font-bold text-amber-400 mb-1">2. Stampa Diretta Browser</div>
            <p className="text-slate-400 mb-2">
              Clicca su <strong>"Salva / Stampa PDF"</strong> (o premi <kbd className="px-1 py-0.5 bg-slate-800 rounded">Ctrl+P</kbd> / <kbd className="px-1 py-0.5 bg-slate-800 rounded">Cmd+P</kbd>).
            </p>
            <p className="text-slate-400">
              Nel menu <strong>Destinazione</strong> seleziona <strong>"Salva su Google Drive"</strong> oppure <strong>"Salva come PDF"</strong>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="font-bold text-amber-400 mb-1">3. File Master Permanente</div>
            <p className="text-slate-400 mb-2">
              Il documento integrale è archiviato permanentemente nel workspace come:
            </p>
            <code className="block p-1.5 rounded bg-slate-900 border border-slate-800 font-mono text-[10px] text-amber-300">
              /HAVE2WANT_MASTER_SPECIFICATION_v1.0.md
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};
