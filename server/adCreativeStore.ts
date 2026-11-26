// Store per progetti creativi e libreria media (Punto 1 — Creative Studio).
// Persistenza su file JSON locale, stesso pattern di adStore/adOrders.
// Nessuna nuova dipendenza esterna.

import fs from 'fs';
import path from 'path';

const PROJECTS_PATH = path.resolve(process.cwd(), '.runtime-creative-projects.json');
const MEDIA_PATH = path.resolve(process.cwd(), '.runtime-creative-media.json');

export interface CreativeProject {
  id: string;
  advertiserId: string;
  advertiserUsername?: string;
  name: string;
  type: 'banner' | 'video';
  canvasState: Record<string, unknown>;
  exportedUrl?: string;
  mimeType?: string;
  width: number;
  height: number;
  format?: string;
  status: 'draft' | 'exported' | 'submitted';
  campaignId?: string;
  orderId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface MediaItem {
  id: string;
  advertiserId: string;
  fileKey: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: number;
  tags?: string[];
}

interface ProjectsStore {
  projects: Record<string, CreativeProject>;
}

interface MediaStore {
  media: Record<string, MediaItem>;
}

const EMPTY_PROJECTS: ProjectsStore = { projects: {} };
const EMPTY_MEDIA: MediaStore = { media: {} };

let _projectsCache: ProjectsStore | null = null;
let _mediaCache: MediaStore | null = null;
let _projectsDirty = false;
let _mediaDirty = false;

function loadProjects(): ProjectsStore {
  if (_projectsCache) return _projectsCache;
  try {
    if (fs.existsSync(PROJECTS_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(PROJECTS_PATH, 'utf8')) as Partial<ProjectsStore>;
      _projectsCache = { projects: parsed.projects ?? {} };
    } else {
      _projectsCache = { ...EMPTY_PROJECTS };
    }
  } catch {
    _projectsCache = { ...EMPTY_PROJECTS };
  }
  return _projectsCache;
}

function saveProjects(): void {
  if (!_projectsCache || !_projectsDirty) return;
  try {
    fs.writeFileSync(PROJECTS_PATH, JSON.stringify(_projectsCache, null, 2), 'utf8');
    _projectsDirty = false;
  } catch {
    // scrittura fallita: il cache resta in memoria
  }
}

function loadMedia(): MediaStore {
  if (_mediaCache) return _mediaCache;
  try {
    if (fs.existsSync(MEDIA_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(MEDIA_PATH, 'utf8')) as Partial<MediaStore>;
      _mediaCache = { media: parsed.media ?? {} };
    } else {
      _mediaCache = { ...EMPTY_MEDIA };
    }
  } catch {
    _mediaCache = { ...EMPTY_MEDIA };
  }
  return _mediaCache;
}

function saveMedia(): void {
  if (!_mediaCache || !_mediaDirty) return;
  try {
    fs.writeFileSync(MEDIA_PATH, JSON.stringify(_mediaCache, null, 2), 'utf8');
    _mediaDirty = false;
  } catch {
    // scrittura fallita
  }
}

function genId(): string {
  const buf = new Uint8Array(4);
  try {
    crypto.getRandomValues(buf);
  } catch {
    // fallback se Web Crypto non disponibile
  }
  const hex = Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${Date.now().toString(36)}-${hex}`;
}

function nowMs(): number {
  return Date.now();
}

// ========== Progetti creativi ==========

export function getProject(id: string): CreativeProject | null {
  return loadProjects().projects[id] ?? null;
}

export function listProjectsByAdvertiser(advertiserId: string): CreativeProject[] {
  return Object.values(loadProjects().projects).filter((p) => p.advertiserId === advertiserId);
}

export function createProject(input: {
  advertiserId: string;
  advertiserUsername?: string;
  name: string;
  type: 'banner' | 'video';
  canvasState: Record<string, unknown>;
  width: number;
  height: number;
  format?: string;
}): CreativeProject {
  const project: CreativeProject = {
    id: genId(),
    advertiserId: input.advertiserId,
    advertiserUsername: input.advertiserUsername,
    name: input.name,
    type: input.type,
    canvasState: input.canvasState,
    width: input.width,
    height: input.height,
    format: input.format,
    status: 'draft',
    createdAt: nowMs(),
    updatedAt: nowMs(),
  };
  const store = loadProjects();
  store.projects[project.id] = project;
  _projectsDirty = true;
  saveProjects();
  return project;
}

export function updateProject(
  id: string,
  patch: Partial<Pick<CreativeProject, 'name' | 'canvasState' | 'width' | 'height' | 'format' | 'status' | 'exportedUrl' | 'mimeType' | 'campaignId' | 'orderId'>>
): CreativeProject | null {
  const store = loadProjects();
  const project = store.projects[id];
  if (!project) return null;
  Object.assign(project, patch);
  project.updatedAt = nowMs();
  _projectsDirty = true;
  saveProjects();
  return project;
}

export function deleteProject(id: string): boolean {
  const store = loadProjects();
  if (!store.projects[id]) return false;
  delete store.projects[id];
  _projectsDirty = true;
  saveProjects();
  return true;
}

export function exportProject(id: string, exportedUrl: string, mimeType: string): CreativeProject | null {
  return updateProject(id, { exportedUrl, mimeType, status: 'exported' });
}

// ========== Libreria media ==========

export function getMedia(id: string): MediaItem | null {
  return loadMedia().media[id] ?? null;
}

export function listMediaByAdvertiser(advertiserId: string): MediaItem[] {
  return Object.values(loadMedia().media).filter((m) => m.advertiserId === advertiserId);
}

export function addMedia(input: {
  advertiserId: string;
  fileKey: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  tags?: string[];
}): MediaItem {
  const item: MediaItem = {
    id: genId(),
    advertiserId: input.advertiserId,
    fileKey: input.fileKey,
    fileUrl: input.fileUrl,
    fileName: input.fileName,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    tags: input.tags,
    uploadedAt: nowMs(),
  };
  const store = loadMedia();
  store.media[item.id] = item;
  _mediaDirty = true;
  saveMedia();
  return item;
}

export function deleteMedia(id: string): boolean {
  const store = loadMedia();
  if (!store.media[id]) return false;
  delete store.media[id];
  _mediaDirty = true;
  saveMedia();
  return true;
}

/** Resetta entrambi gli store per i test. */
export function resetCreativeStoreForTests(): void {
  _projectsCache = null;
  _mediaCache = null;
  _projectsDirty = false;
  _mediaDirty = false;
  try {
    fs.unlinkSync(PROJECTS_PATH);
  } catch {
    // ignorato
  }
  try {
    fs.unlinkSync(MEDIA_PATH);
  } catch {
    // ignorato
  }
}
