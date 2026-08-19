"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { 
  Upload, 
  FileCode, 
  Download, 
  Plus, 
  FolderSearch,
  Package,
  Binary,
  Settings2,
  Info,
  Flame,
  Trash2,
  Clock,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Zap,
  Copy,
  Search,
  Cloud,
  Rocket,
  ChefHat,
  Sprout,
  Loader2,
  CheckCircle2,
  Flower2,
  Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { generateZIP, parseUploadedFiles, EcosystemState, ConfigEntry, stringifyYaml, sanitizePath, isInternalNamespace, XFOODS_NAMESPACE, leafId, StudioFile, PluginEditor, mapFor } from "@/lib/studio";
import PublishModal from "@/components/PublishModal";
import { extractPresetBundle } from "@/lib/preset-bundle";
import { exportEcosystem } from "@/lib/export";
import SyncModal from "@/components/SyncModal";
import { Model3DViewer } from "@/components/Model3DViewer";
import AutocompleteInput from "@/components/AutocompleteInput";
import { MATERIALS, SOUNDS, PARTICLES } from "@/lib/minecraft";
import CropStagesEditor from "@/components/CropStagesEditor";
import MachineRecipesEditor from "@/components/MachineRecipesEditor";
import PotionEffectsEditor, { PotionConfig } from "@/components/PotionEffectsEditor";
import CommandActionRow from "@/components/CommandActionRow";

// --- TYPES ---
interface IAItemConfig {
  resource?: {
    generate?: boolean;
    model_path?: string;
    textures?: string[];
  };
}

// --- COMPONENTS ---

const VisualPreview = ({ mcPath, rawFiles, namespace }: { mcPath: string | null, rawFiles: StudioFile[], namespace: string }) => {
    const [url, setUrl] = useState<string | null>(null);
    const [is3D, setIs3D] = useState(false);
    const [modelData, setModelData] = useState<any | null>(null);
    const [textureUrls, setTextureUrls] = useState<Record<string, string>>({});

    useEffect(() => {
        let currentUrl: string | null = null;
        const objectUrls: string[] = [];
        let isCurrent3D = false;
        let currentModel: any = null;
        let currentTextures: Record<string, string> = {};
        
        const cleanup = () => {
            if (currentUrl) URL.revokeObjectURL(currentUrl);
            objectUrls.forEach(u => URL.revokeObjectURL(u));
        };

        if (!mcPath) return cleanup;

        const [ns, path] = mcPath.includes(':') ? mcPath.split(':') : [namespace, mcPath];

        const targetModel = `resource_pack/assets/${ns}/models/${path}.json`;
        const modelFile = rawFiles.find(f => f.inferredPath.endsWith(targetModel));

        if (modelFile) {
            try {
                const text = new TextDecoder().decode(modelFile.content as ArrayBuffer);
                const model = JSON.parse(text);
                if (model.elements) {
                    isCurrent3D = true;
                    currentModel = model;
                    
                    if (model.textures) {
                        Object.entries(model.textures).forEach(([key, texPath]: [string, any]) => {
                            const [tNs, tP] = texPath.includes(':') ? texPath.split(':') : [ns, texPath];
                            const texFile = rawFiles.find(f => f.inferredPath.endsWith(`resource_pack/assets/${tNs}/textures/${tP}.png`));
                            if (texFile) {
                                const u = URL.createObjectURL(new Blob([texFile.content]));
                                currentTextures[key] = u;
                                objectUrls.push(u);
                            }
                        });
                    }
                }
            } catch (e) {
                console.error("3D Load failed", e);
            }
        }

        if (!isCurrent3D) {
            const targetTex = `resource_pack/assets/${ns}/textures/${path}.png`;
            const file = rawFiles.find(f => f.inferredPath.endsWith(targetTex));
            if (file) {
                currentUrl = URL.createObjectURL(new Blob([file.content]));
            }
        }

        setIs3D(isCurrent3D);
        setModelData(currentModel);
        setTextureUrls(currentTextures);
        setUrl(currentUrl);

        return cleanup;
    }, [mcPath, rawFiles, namespace]);

    if (is3D && modelData) {
        return (
            <div className="w-32 h-32 bg-black/40 rounded-2xl flex items-center justify-center border border-white/10 shrink-0 overflow-hidden shadow-inner cursor-grab active:cursor-grabbing">
                <Model3DViewer model={modelData} textureUrls={textureUrls} />
            </div>
        );
    }

    if (!url) return <div className="w-32 h-32 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 shrink-0"><Package className="w-8 h-8 text-gray-700" /></div>;
    
    return (
        <div className="w-32 h-32 bg-black/40 rounded-2xl flex items-center justify-center border border-white/10 shrink-0 overflow-hidden group/preview relative shadow-inner">
            <img src={url} alt="Preview" className="max-w-[80%] max-h-[80%] object-contain image-pixelated transition-transform group-hover/preview:scale-110 duration-500" />
        </div>
    );
};

/**
 * Secciones del Studio que editan ficheros de plugin (todo menos ItemsAdder).
 * Cada una se corresponde con una carpeta real del servidor.
 */
/**
 * Secciones de la barra superior. El color identifica, pero vive en un punto de 6px:
 * teñir seis botones enteros hacía que compitieran entre sí y que nada destacara.
 */
const SECCIONES = [
  { id: 'xfoods',     label: 'Comidas',       color: 'var(--color-sec-foods)',      desc: 'Ítems consumibles e ingredientes de xFoods' },
  { id: 'xmachines',  label: 'Estaciones',    color: 'var(--color-sec-machines)',   desc: 'Máquinas de cocina y sus recetas' },
  { id: 'xcrops',     label: 'Cultivos',      color: 'var(--color-sec-crops)',      desc: 'Especies cultivables y sus fases' },
  { id: 'xpods',      label: 'Maceteros',     color: 'var(--color-sec-pods)',       desc: 'Modificadores de crecimiento y plagas' },
  { id: 'xautomation',label: 'Automatización',color: 'var(--color-sec-automation)', desc: 'Regadores, lámparas, recolectores' },
  { id: 'ia',         label: 'ItemsAdder',    color: 'var(--color-sec-ia)',         desc: 'Modelos 3D y texturas' },
] as const;

/** Tipos de MachineConfiguration.MachineType que acepta xFoodsCrops. */
const AUTOMATION_TYPES = ['AUTO_WATERER', 'SMART_LIGHT', 'AUTO_FERTILIZER_ORGANIC',
  'AUTO_FERTILIZER_CHEMICAL', 'AUTO_HARVESTER', 'AUTO_PESTICIDE'] as const;

// --- MAIN PAGE ---
export default function StudioWorkspace() {
  const [projectState, setProjectState] = useState<EcosystemState | null>(null);
  const [activeEditor, setActiveEditor] = useState<PluginEditor | 'ia'>('xfoods');
  const [activeCategory, setActiveCategory] = useState<string>("items"); 
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [selectedNamespace, setSelectedNamespace] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [activePreview, setActivePreview] = useState<'plugin' | 'ia'>('plugin');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isAutoImporting, setIsAutoImporting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const iaFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const availableNamespaces = useMemo(() => {
    if (!projectState) return [];
    const nss = new Set<string>();
    Object.keys(projectState.iaItems).forEach(k => nss.add(k.split('/')[0]));
    Object.keys(projectState.iaBlocks).forEach(k => nss.add(k.split('/')[0]));
    Object.keys(projectState.iaFurnitures).forEach(k => nss.add(k.split('/')[0]));
    return Array.from(nss).filter(n => !isInternalNamespace(n)).sort();
  }, [projectState]);

  useEffect(() => {
    if (availableNamespaces.length > 0 && !selectedNamespace) {
        setSelectedNamespace(availableNamespaces[0]);
    }
  }, [availableNamespaces, selectedNamespace]);

  const handleSyncToBridge = async () => {
    if (!projectState) return null;
    const blob = await generateZIP(projectState);
    const formData = new FormData();
    formData.append('file', blob, 'sync.zip');

    const res = await fetch('/api/sync/publish', {
        method: 'POST',
        body: formData
    });
    const data = await res.json();
    return data.token;
  };

  const handleImportFromBridge = async (token: string) => {
    const res = await fetch(`/api/sync/download/${token}`);
    if (!res.ok) throw new Error('Token invalid');
    const blob = await res.blob();
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(blob);
    const files: File[] = [];
    for (const [path, zipEntry] of Object.entries(zip.files)) {
        if (zipEntry.dir) continue;
        const buffer = await zipEntry.async('arraybuffer');
        files.push(new File([buffer], path, { type: 'application/octet-stream' }));
    }
    const state = await parseUploadedFiles(files);
    setProjectState(state);
    return state;
  };

  /** Devuelve un mensaje de error, o null si se publicó bien. Ver PublishModal. */
  const handlePublish = async (title: string, description: string): Promise<string | null> => {
    if (!projectState || !selectedItem || activeEditor === 'ia') return 'Nada seleccionado.';
    try {
        const blob = await extractPresetBundle(projectState, activeEditor as PluginEditor, selectedItem);
        const formData = new FormData();
        formData.append('file', blob, 'preset.zip');
        formData.append('title', title);
        formData.append('description', description);
        formData.append('pluginEditor', activeEditor);
        formData.append('itemId', selectedItem);

        const res = await fetch('/api/discover/submit', { method: 'POST', body: formData });
        if (res.status === 401) return 'Tienes que iniciar sesión con Google para publicar. Ábrelo en otra pestaña: /login';
        if (!res.ok) {
            const data = await res.json().catch(() => null);
            return data?.error || 'Error al publicar.';
        }
        return null;
    } catch (err) {
        console.error('[Discover] Publish failed', err);
        return 'Error inesperado al preparar el paquete.';
    }
  };

  useEffect(() => {
    if (!mounted) return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token && !projectState && !isAutoImporting) {
        setIsAutoImporting(true);
        handleImportFromBridge(token)
            .then((state) => {
                setProjectState(state);
                setTimeout(() => {
                    window.history.replaceState({}, '', window.location.pathname);
                }, 100);
            })
            .catch(err => {
                console.error("[Bridge] Auto-import failed", err);
                alert("Error al importar: El token no existe o ha expirado.");
                window.history.replaceState({}, '', window.location.pathname);
            })
            .finally(() => setIsAutoImporting(false));
    }
  }, [projectState, isAutoImporting, mounted]);

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    try {
      const state = await parseUploadedFiles(e.target.files);
      setProjectState(state);
    } catch (err) {
      console.error("Import failed", err);
    }
  };

  const updateField = (path: string, value: any, iaFullKey?: string) => {
    if (!projectState || !selectedItem) return;
    const newState = { ...projectState };
    
    if (activeEditor === 'ia' && iaFullKey) {
        let targetMap: any;
        if (activeCategory === 'items') targetMap = newState.iaItems;
        else if (activeCategory === 'blocks') targetMap = newState.iaBlocks;
        else targetMap = newState.iaFurnitures;

        const config = targetMap[iaFullKey];
        if (!config) return;

        const keys = path.split('.');
        let current: any = config;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
    } 
    else {
        // mapFor cubre las 5 secciones de plugin; antes esto era un ternario a mano que solo
        // distinguía xfoods/xcrops y mandaba xpods y xautomation al mapa de machines, así que
        // cualquier edición de un macetero o una máquina de automatización mutaba (o intentaba
        // mutar) una entrada inexistente en newState.machines.
        const entry = mapFor(newState, activeEditor as PluginEditor)[selectedItem];

        if (path === 'folder') {
            entry.folder = value;
        } else if (path === 'ia-toggle') {
            const item = entry.config;
            if (value) {
                // Las Estaciones pueden vincularse como Ítem (modelo 3D solo en mano/inventario,
                // se coloca como el material de vanilla) o como Mueble (el modelo 3D también se
                // ve colocado, vía el sistema de furniture de ItemsAdder). El resto de secciones
                // solo conocen "Ítem": value siempre llega como true para ellas.
                const isFurniture = value === 'furniture';

                // xFoods (comidas y máquinas) usa el bloque "item"; xFoodsCrops (semillas) usa "seed".
                if (!(item as any).item && activeEditor !== 'xcrops') (item as any).item = {};
                if (!(item as any).seed && activeEditor === 'xcrops') (item as any).seed = {};

                const target = activeEditor === 'xcrops' ? (item as any).seed : (item as any).item;
                const subfolder = activeEditor === 'xfoods' ? 'food' : (activeEditor === 'xcrops' ? 'crops' : 'machines');

                // El id del plugin es el nombre del fichero SIN su carpeta: una comida en
                // foods/consumibles/hamburguesa_cerdo.yml se registra como "hamburguesa_cerdo".
                // Usar la clave completa metía la carpeta en el id de ItemsAdder ("/" no es
                // válido en un nombre de ítem) y generaba un itemsadder-id que el plugin no
                // resuelve.
                const itemId = leafId(selectedItem);

                (target as Record<string, unknown>)['itemsadder-id'] = `${XFOODS_NAMESPACE}:${itemId}`;

                const fullKey = `${XFOODS_NAMESPACE}/${itemId}`;
                const material = (target as Record<string, string>)?.material || "PAPER";
                const displayName = (item as any)['display-name'];

                // Cambiar de Ítem a Mueble (o viceversa) no debe dejar el registro anterior
                // huérfano en el otro mapa: solo uno de los dos debe existir a la vez.
                delete newState.iaItems[fullKey];
                delete newState.iaFurnitures[fullKey];

                if (isFurniture) {
                    newState.iaFurnitures[fullKey] = {
                        info: { namespace: XFOODS_NAMESPACE },
                        // ItemsAdder no tiene sección de nivel superior "furniture"/"furnitures": todo
                        // vive bajo "items", y lo que lo hace mueble es el bloque behaviours.furniture
                        // de cada entrada. Confirmado decompilando ItemsAdder_4.0.17.jar (el Converter
                        // interno solo conoce y reordena la clave "items").
                        items: {
                            [itemId]: {
                                enabled: true,
                                display_name: displayName || "Nuevo Mueble",
                                permission: `${XFOODS_NAMESPACE}.furniture.${itemId}`,
                                resource: {
                                    material,
                                    generate: true,
                                    model_path: `${XFOODS_NAMESPACE}:furniture/${subfolder}/${itemId}`
                                },
                                // Esquema real de ItemsAdder (docs oficiales, wiki.itemsadder.com/adding-content/furnitures):
                                // "entity" es una propiedad PLANA de behaviours.furniture (valores en minúscula:
                                // armor_stand/item_frame/item_display/glow_item_frame, por defecto armor_stand si
                                // se omite), no una sección anidada "armor_stand: {...}" ni una clave inventada
                                // "furniture_type". small/solid/hitbox también van planos, como hermanos de entity.
                                behaviours: {
                                    furniture: {
                                        entity: "armor_stand",
                                        small: true,
                                        hitbox: { length: 1, width: 1, height: 1 }
                                    }
                                }
                            }
                        }
                    };
                } else {
                    newState.iaItems[fullKey] = {
                        info: { namespace: XFOODS_NAMESPACE },
                        items: {
                            [itemId]: {
                                enabled: true,
                                display_name: displayName || "Nuevo Ítem",
                                permission: `${XFOODS_NAMESPACE}.${itemId}`,
                                resource: {
                                    material,
                                    generate: true,
                                    textures: [`${XFOODS_NAMESPACE}:item/${subfolder}/${itemId}`]
                                }
                            }
                        }
                    };
                }
            } else {
                if (activeEditor !== 'xcrops' && (item as any).item) delete (item as any).item['itemsadder-id'];
                if (activeEditor === 'xcrops' && (item as any).seed) delete (item as any).seed['itemsadder-id'];
                delete newState.iaItems[`${XFOODS_NAMESPACE}/${leafId(selectedItem)}`];
                delete newState.iaFurnitures[`${XFOODS_NAMESPACE}/${leafId(selectedItem)}`];
            }
        } else {
            const keys = path.split('.');
            let current: any = entry;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]] = {};
                current = current[keys[i]];
            }
            if (keys[keys.length-1] === 'lore' && typeof value === 'string') {
                current[keys[keys.length-1]] = value.split('\n');
            } else {
                current[keys[keys.length-1]] = value;
            }

            // Cuando el ítem está vinculado a ItemsAdder, el material que manda de verdad es el
            // del config de IA: el plugin construye el ítem desde ItemsAdder e ignora el material
            // de la comida. El material se copiaba al activar la integración pero no se propagaba
            // después, así que cambiarlo en el editor no tenía ningún efecto en el juego.
            // El vínculo puede ser un Ítem o un Mueble de ItemsAdder (solo las Estaciones ofrecen
            // Mueble); solo uno de los dos mapas tiene la entrada en cada momento.
            const iaFullKeySync = `${XFOODS_NAMESPACE}/${leafId(selectedItem)}`;
            const linkedIaItem: any = (newState.iaItems[iaFullKeySync] as any)?.items?.[leafId(selectedItem)];
            const linkedIaFurniture: any = (newState.iaFurnitures[iaFullKeySync] as any)?.items?.[leafId(selectedItem)];
            const linkedIa = linkedIaItem || linkedIaFurniture;

            const esMaterial = path === 'config.item.material' || path === 'config.seed.material';
            if (esMaterial && linkedIa) {
                linkedIa.resource = linkedIa.resource || {};
                linkedIa.resource.material = value;
            }

            // El nombre visible también vive en los dos sitios; mantenerlos sincronizados evita
            // que el ítem/mueble de ItemsAdder se quede con el nombre viejo.
            if (path === 'config.display-name' && linkedIa) {
                linkedIa.display_name = value;
            }
        }
    }
    setProjectState(newState);
  };

  // Permite a los editores de recetas/etapas (que tienen listas dinámicas: añadir/quitar
  // ingredientes, requisitos, etc.) mutar directamente el config del ítem seleccionado,
  // sin tener que pasar por el sistema de rutas plano de updateField().
  const mutateSelectedConfig = (mutator: (config: any) => void) => {
    if (!projectState || !selectedItem) return;
    const newState = { ...projectState };
    const entry = mapFor(newState, activeEditor as PluginEditor)[selectedItem];
    if (!entry) return;
    mutator(entry.config);
    setProjectState(newState);
  };

  const handleCreateNew = () => {
    if (!projectState) return;
    const timestamp = Date.now();
    const newState = { ...projectState };
    if (activeEditor === 'ia') {
        const id = prompt("ID del objeto ItemsAdder:");
        if (!id || !selectedNamespace) return;
        const sid = sanitizePath(id);
        const targetFileId = activeCategory === 'furnitures' ? "created_furnitures" : (activeCategory === 'blocks' ? "created_blocks" : "created_items");
        const fullKey = `${selectedNamespace}/${targetFileId}`;
        
        // "furnitures" es solo el nombre de la pestaña/categoría en la UI: ItemsAdder registra
        // los muebles bajo la misma clave "items" que todo lo demás (ver nota más abajo).
        let keyName = activeCategory === 'blocks' ? "blocks" : "items";
        
        let targetMap: any;
        if (activeCategory === 'items') targetMap = newState.iaItems;
        else if (activeCategory === 'blocks') targetMap = newState.iaBlocks;
        else targetMap = newState.iaFurnitures;

        if (!targetMap[fullKey]) {
            targetMap[fullKey] = { 
                info: { namespace: selectedNamespace }, 
                [keyName]: {} 
            };
        }
        if (!targetMap[fullKey][keyName]) targetMap[fullKey][keyName] = {};

        targetMap[fullKey][keyName][sid] = activeCategory === 'furnitures' ? {
            enabled: true,
            display_name: id,
            permission: `${selectedNamespace}.furniture.${sid}`,
            resource: { material: "PAPER", generate: true, model_path: `${selectedNamespace}:furniture/${sid}` },
            behaviours: {
                furniture: {
                    entity: "armor_stand",
                    small: true,
                    hitbox: { length: 1, width: 1, height: 1 }
                }
            }
        } : (activeCategory === 'blocks' ? {
            enabled: true,
            display_name: id,
            resource: { material: "STONE", generate: true },
            specific_properties: { block: { can_be_placed: true } }
        } : { 
            enabled: true,
            display_name: id, 
            resource: { material: "PAPER", generate: true, textures: [`${selectedNamespace}:item/${sid}`] } 
        });
        setProjectState(newState);
        setSelectedItem(sid);
    } else {
        const id = sanitizePath(`nuevo_${timestamp}`);
        if (activeEditor === 'xfoods') newState.foods[id] = { config: { "display-name": "Nueva Comida", stats: { "food-level": 4, saturation: 2.0, bites: 1, consumable: true }, item: { material: "PORKCHOP" } }, folder: "" };
        else if (activeEditor === 'xcrops') newState.crops[id] = { config: { "display-name": "Nuevo Cultivo", seed: { material: "WHEAT_SEEDS" }, growth: { stages: {} } }, folder: "" };
        else if (activeEditor === 'xpods') newState.pods[id] = { config: { "display-name": "&fNuevo Macetero", item: { material: "FLOWER_POT" }, modifiers: { "growth-speed": 1.0, "nutrient-rate": 1.0, yield: 1.0 }, probabilities: { "pest-chance": 0.05 } }, folder: "" };
        else if (activeEditor === 'xautomation') newState.cropMachines[id] = { config: { "display-name": "&bNueva Máquina", type: "AUTO_WATERER", range: 5, item: { material: "DISPENSER" }, fuel: { "consume-per-action": 1 }, "storage-slots": 9 }, folder: "" };
        else newState.machines[id] = { config: { "display-name": "Nueva Estación", recipes: {} }, folder: "" };
        setProjectState(newState);
        setSelectedItem(id);
    }
  };

  const handleCloneItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!projectState) return;
    const newState = { ...projectState };
    const currentMap = mapFor(newState, activeEditor as PluginEditor);
    const originalEntry = currentMap[id];
    if (!originalEntry) return;
    let finalId = sanitizePath(`${id}_copy`);
    let counter = 1;
    while (currentMap[finalId]) { finalId = sanitizePath(`${id}_copy_${counter++}`); }
    const copy = JSON.parse(JSON.stringify(originalEntry));
    currentMap[finalId] = copy;
    setProjectState(newState);
    setSelectedItem(finalId);
  };

  const filteredItems = useMemo(() => {
    if (!projectState) return [];
    if (activeEditor === 'ia') {
        if (!selectedNamespace) return [];
        const result: [string, any][] = [];
        let targetMap: any;
        const keyName = activeCategory === 'blocks' ? "blocks" : "items";
        if (activeCategory === 'items') targetMap = projectState.iaItems;
        else if (activeCategory === 'blocks') targetMap = projectState.iaBlocks;
        else targetMap = projectState.iaFurnitures;
        Object.entries(targetMap).forEach(([fullKey, config]: [string, any]) => {
            if (fullKey.startsWith(`${selectedNamespace}/`)) {
                const subMap = config[keyName] || {};
                Object.entries(subMap).forEach(([id, data]) => {
                    if (!searchTerm || id.toLowerCase().includes(searchTerm.toLowerCase())) result.push([id, { fullKey, data }]);
                });
            }
        });
        return result;
    } else {
        const targetMap = mapFor(projectState, activeEditor as PluginEditor);
        return Object.entries(targetMap).filter(([id]) => !searchTerm || id.toLowerCase().includes(searchTerm.toLowerCase()));
    }
  }, [projectState, activeEditor, activeCategory, selectedNamespace, searchTerm]);

  const selectedData = useMemo(() => {
    if (!selectedItem || !projectState) return null;
    if (activeEditor === 'ia') return filteredItems.find(([id]) => id === selectedItem)?.[1];
    return mapFor(projectState, activeEditor as PluginEditor)[selectedItem];
  }, [selectedItem, filteredItems, activeEditor, projectState]);

  const groupedX = useMemo(() => {
    if (!projectState || activeEditor === 'ia') return {};
    const targetMap = mapFor(projectState, activeEditor as PluginEditor);
    const groups: Record<string, string[]> = {};
    Object.entries(targetMap).forEach(([id, data]) => {
        if (searchTerm && !id.toLowerCase().includes(searchTerm.toLowerCase())) return;
        const folder = data.folder || "Raíz";
        if (!groups[folder]) groups[folder] = [];
        groups[folder].push(id);
    });
    return groups;
  }, [projectState, activeEditor, searchTerm]);

  const handleIAFileUpload = async (e: any) => {
    let filesList: File[] = [];
    if (e.dataTransfer) {
      e.preventDefault();
      e.stopPropagation();
      filesList = Array.from(e.dataTransfer.files as FileList);
    } else if (e.target && e.target.files) {
      filesList = Array.from(e.target.files);
    }

    if (filesList.length === 0 || !projectState || !selectedItem) return;

    // La sección de xFoods/xCrops/Estaciones sube archivos directamente al ítem de ItemsAdder
    // que quedó vinculado al activar el switch "ItemsAdder" para ese ítem.
    const isFoodContext = activeEditor === 'xfoods' || activeEditor === 'xcrops' || activeEditor === 'xmachines';

    if (isFoodContext) {
        if (!isIAEnabled) {
            alert("Activa primero la integración con ItemsAdder para este ítem.");
            return;
        }
    } else if (!selectedNamespace || !selectedData) {
        return;
    }

    // Solo las Estaciones pueden estar vinculadas a un Mueble en vez de a un Ítem.
    const machineIsFurniture = activeEditor === 'xmachines' && iaKind === 'furniture';

    const newState = { ...projectState };
    // Comidas y cultivos van siempre a su propio namespace; lo creado desde la pestaña de
    // ItemsAdder respeta el namespace elegido en el desplegable.
    const ns = isFoodContext ? XFOODS_NAMESPACE : (selectedNamespace as string);
    const fullKey = isFoodContext ? `${XFOODS_NAMESPACE}/${leafId(selectedItem)}` : (selectedData as any).fullKey;
    const keyName = isFoodContext ? "items" : currentIAKeyName;
    const targetMap: Record<string, any> = isFoodContext
        ? (machineIsFurniture ? newState.iaFurnitures : newState.iaItems)
        : (activeCategory === 'items' ? newState.iaItems : (activeCategory === 'blocks' ? newState.iaBlocks : newState.iaFurnitures));

    // Dentro del YAML de ItemsAdder el ítem se llama por su hoja, no por la ruta del fichero.
    const entryItemId = isFoodContext ? leafId(selectedItem) : selectedItem;

    const iaEntry = targetMap[fullKey];
    if (!iaEntry || !iaEntry[keyName] || !iaEntry[keyName][entryItemId]) return;

    const subfolder = isFoodContext
        ? (activeEditor === 'xfoods' ? 'food' : (activeEditor === 'xcrops' ? 'crops' : 'machines'))
        : (activeCategory === 'furnitures' ? 'furniture' : (activeCategory === 'blocks' ? 'block' : 'item'));
    const modelFolder = isFoodContext
        ? (machineIsFurniture ? `furniture/${subfolder}` : `item/${subfolder}`)
        : subfolder;

    // Helper to add or replace raw file
    const upsertRawFile = (name: string, content: ArrayBuffer, inferredPath: string) => {
        const existingIdx = newState.rawFiles.findIndex(f => f.inferredPath === inferredPath);
        const newFile: StudioFile = { name, content, type: 'raw', inferredPath };
        if (existingIdx !== -1) {
            newState.rawFiles[existingIdx] = newFile;
        } else {
            newState.rawFiles.push(newFile);
        }
    };

    // El nombre del ítem manda: tanto la textura como el modelo se renombran a este nombre
    const modelName = sanitizePath(entryItemId);

    // Mapa de nombre de textura original (referenciado en el JSON) -> nuevo nombre basado en el ID del ítem
    const textureRenameMap: Record<string, string> = {};
    /** Nombres finales de textura que el modelo espera encontrar como .png. */
    let texturasEsperadas = new Set<string>();
    /** Texturas subidas en esta operación, por si el ítem no tiene modelo propio. */
    const texturasSubidas: string[] = [];
    /** Nombres finales que sí hemos recibido, para avisar de los que falten. */
    const texturasRecibidas = new Set<string>();
    const resource = iaEntry[keyName][entryItemId].resource = iaEntry[keyName][entryItemId].resource || {};
    let hasModelJson = false;

    for (const file of filesList) {
      if (file.name.endsWith('.json')) {
        let buffer = await file.arrayBuffer();
        const sanitizedFileName = `${modelName}.json`;
        try {
            const text = new TextDecoder().decode(buffer);
            const model = JSON.parse(text);
            if (model.textures) {
                const textureKeys = Object.keys(model.textures);
                const nombreBase = (v: unknown) =>
                    sanitizePath(String(v).split('/').pop() || String(v)).replace('.png', '');

                // Se cuentan las IMÁGENES distintas, no las claves. Blockbench casi siempre
                // añade una clave "particle" que apunta a la misma textura que otra slot: con
                // el conteo por claves eso parecían "varias texturas" y el modelo pasaba a
                // referenciar "<item>_<original>", mientras que el PNG se guardaba como
                // "<item>". El modelo cargaba, pero sin textura.
                const imagenesDistintas = new Set(Object.values(model.textures).map(nombreBase));
                const usarSufijo = imagenesDistintas.size > 1;

                textureKeys.forEach(key => {
                    const originalName = nombreBase(model.textures[key]);
                    const newName = usarSufijo ? `${modelName}_${originalName}` : modelName;
                    textureRenameMap[originalName] = newName;
                    model.textures[key] = `${ns}:${modelFolder}/${newName}`;
                });

                texturasEsperadas = new Set(Object.values(textureRenameMap));
                buffer = new TextEncoder().encode(JSON.stringify(model, null, 2)).buffer;
            }
        } catch (err) { console.error("Error processing JSON model", err); }

        const targetPath = `plugins/ItemsAdder/contents/${ns}/resource_pack/assets/${ns}/models/${modelFolder}/${sanitizedFileName}`;
        upsertRawFile(sanitizedFileName, buffer, targetPath);

        resource.model_path = `${ns}:${modelFolder}/${modelName}`;
        resource.generate = false;
        hasModelJson = true;
      }
    }

    for (const file of filesList) {
      if (file.name.endsWith('.png')) {
        const buffer = await file.arrayBuffer();
        const originalName = sanitizePath(file.name).replace('.png', '');
        // Si el modelo solo usa una imagen, cualquier PNG que se suba es esa imagen, se llame
        // como se llame en disco. Con varias hay que emparejar por nombre.
        const newName = textureRenameMap[originalName]
            || (texturasEsperadas.size <= 1 ? modelName : originalName);
        texturasRecibidas.add(newName);
        const finalFileName = `${newName}.png`;
        const targetPath = `plugins/ItemsAdder/contents/${ns}/resource_pack/assets/${ns}/textures/${modelFolder}/${finalFileName}`;
        upsertRawFile(finalFileName, buffer, targetPath);
        texturasSubidas.push(`${ns}:${modelFolder}/${newName}`);
      }
    }

    // 'generate' se decide al final, mirando si el ítem TIENE modelo propio, no si venía uno en
    // esta subida concreta. Antes se decidía dentro del bucle de PNG con una variable local: al
    // subir la textura en un paso aparte (o al re-subirla para corregirla) volvía a poner
    // generate: true y pisaba el model_path ya guardado. Con generate: true ItemsAdder fabrica
    // un modelo plano 2D desde la textura e ignora el modelo de Blockbench, así que el ítem se
    // veía completamente distinto.
    if (resource.model_path) {
        resource.generate = false;
        // Con un modelo propio, las texturas salen de dentro del .json. Dejar aquí una lista
        // suelta es, en el mejor caso, redundante, y ambigua para ItemsAdder.
        delete resource.textures;
    } else if (texturasSubidas.length > 0) {
        resource.generate = true;
        resource.textures = [texturasSubidas[0]];
    }
    setProjectState(newState);

    // El fallo más difícil de diagnosticar es que el modelo cargue sin textura, así que si
    // alguna de las que referencia no ha llegado, se dice claramente cuál falta.
    const faltan = [...texturasEsperadas].filter(t => !texturasRecibidas.has(t));
    if (faltan.length > 0) {
        alert(`Archivos vinculados, pero el modelo referencia texturas que no has subido:\n\n`
            + faltan.map(t => `  · ${t}.png`).join('\n')
            + `\n\nSin ellas el modelo se verá sin textura.`);
    } else {
        alert('¡Archivos vinculados!');
    }
  };

  /**
   * Cambia el tipo de entidad del Mueble de una Estación vinculada. "entity" es una propiedad
   * plana de behaviours.furniture (armor_stand/item_frame/item_display/glow_item_frame, en
   * minúsculas) — no una clave inventada "furniture_type" ni una sección anidada por tipo.
   * Solo tiene sentido cuando la Estación está vinculada como Mueble (linkedIaFurnitureEntry).
   */
  const updateLinkedFurnitureType = (newEntity: string) => {
    if (!projectState || !selectedItem) return;
    const fullKey = `${XFOODS_NAMESPACE}/${leafId(selectedItem)}`;
    const newState = { ...projectState };
    const config = newState.iaFurnitures[fullKey] as Record<string, any>;
    const item = config?.items?.[leafId(selectedItem)];
    if (!item) return;

    if (!item.behaviours) item.behaviours = {};
    if (!item.behaviours.furniture) item.behaviours.furniture = {};
    item.behaviours.furniture.entity = newEntity;

    // "small" solo es relevante para armor_stand (ajusta el tamaño del modelo en Blockbench).
    if (newEntity === 'armor_stand') {
        item.behaviours.furniture.small = true;
    } else {
        delete item.behaviours.furniture.small;
    }
    setProjectState(newState);
  };

  // Ids tal y como los registra el plugin (sin carpeta): es lo que hay que escribir en las
  // recetas, en harvest.xfoods-id y en el combustible de las máquinas.
  const foodIdOptions = useMemo(
    () => Array.from(new Set(Object.keys(projectState?.foods ?? {}).map(leafId))).sort(),
    [projectState]
  );

  const linkedIaItemEntry = selectedItem && projectState
    ? (projectState.iaItems[`${XFOODS_NAMESPACE}/${leafId(selectedItem)}`] as any)?.items?.[leafId(selectedItem)]
    : undefined;
  const linkedIaFurnitureEntry = selectedItem && projectState
    ? (projectState.iaFurnitures[`${XFOODS_NAMESPACE}/${leafId(selectedItem)}`] as any)?.items?.[leafId(selectedItem)]
    : undefined;
  const linkedIaEntry = linkedIaItemEntry || linkedIaFurnitureEntry;
  const isIAEnabled = !!linkedIaEntry;
  /** Solo las Estaciones distinguen Ítem de Mueble; el resto de secciones siempre son "item". */
  const iaKind: 'item' | 'furniture' | null = linkedIaItemEntry ? 'item' : (linkedIaFurnitureEntry ? 'furniture' : null);

  if (!mounted) return null;

  if (isAutoImporting) {
    return (
        <div className="h-screen flex flex-col items-center justify-center space-y-6 bg-surface-0">
            <div className="relative"><div className="w-24 h-24 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin" /><Cloud className="absolute inset-0 m-auto w-8 h-8 text-yellow-400 animate-pulse" /></div>
            <h2 className="text-lg font-medium text-ink">Sincronizando...</h2>
        </div>
    );
  }

  if (!projectState) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-12 animate-in fade-in zoom-in-95 duration-700">
        <div className="space-y-4">
          <div className="bg-yellow-400/10 p-6 rounded-full w-fit mx-auto border border-yellow-400/20"><Settings2 className="w-16 h-16 text-yellow-400" /></div>
          <h1 className="text-3xl font-semibold text-ink tracking-tight">Studio Workspace</h1>
          <p className="text-ink-2 text-sm max-w-md mx-auto">IA • XFOODS • XCROPS</p>
        </div>
        <div className="grid grid-cols-2 gap-8">
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-line rounded-3xl p-16 hover:border-yellow-400/10 hover:bg-yellow-400/5 transition-all cursor-pointer group">
                <input type="file" ref={fileInputRef} onChange={handleFolderUpload} className="hidden" {...({ webkitdirectory: "", directory: "" } as any)} />
                <Upload className="w-12 h-12 text-gray-500 mx-auto mb-6 group-hover:text-yellow-400 transition-colors" />
                <p className="text-ink font-medium text-base">Subir Carpeta</p>
            </div>
            <div onClick={() => setIsSyncModalOpen(true)} className="border-2 border-dashed border-blue-500/20 rounded-3xl p-16 hover:border-blue-500/10 hover:bg-blue-500/5 transition-all cursor-pointer group">
                <Cloud className="w-12 h-12 text-gray-500 mx-auto mb-6 group-hover:text-blue-400 transition-colors" />
                <p className="text-ink font-medium text-base">xLib Bridge</p>
            </div>
        </div>
        <SyncModal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} onSync={handleSyncToBridge} onImport={handleImportFromBridge} />
      </div>
    );
  }

  const currentIAKeyName = activeCategory === 'blocks' ? "blocks" : "items";

  return (
    <div className="h-full flex flex-col space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="panel px-5 py-3.5 flex justify-between items-center gap-6">
        <div className="flex items-center gap-8">
            <div className="flex items-center gap-0.5 bg-surface-0 p-1 rounded-[8px] border border-line">
                {SECCIONES.map(sec => {
                    const activa = activeEditor === sec.id;
                    const n = sec.id === 'ia'
                        ? Object.keys(projectState.iaItems).length + Object.keys(projectState.iaBlocks).length + Object.keys(projectState.iaFurnitures).length
                        : Object.keys(mapFor(projectState, sec.id as PluginEditor)).length;
                    return (
                        <button key={sec.id} onClick={() => { setActiveEditor(sec.id as PluginEditor | 'ia'); setSelectedItem(null); }}
                                className="tab" data-active={activa} title={sec.desc}>
                            <span className="tab-dot" style={{ background: activa ? sec.color : 'var(--color-ink-3)' }} />
                            {sec.label}
                            <span className="tab-count">{n}</span>
                        </button>
                    );
                })}
            </div>
            {activeEditor === 'ia' && selectedNamespace && (
                <div className="flex flex-col border-l border-line pl-8">
                    <label className="eyebrow mb-1">Pack</label>
                    <select value={selectedNamespace} onChange={(e) => { setSelectedNamespace(e.target.value); setSelectedItem(null); }} className="bg-transparent text-[13px] font-semibold text-accent outline-none cursor-pointer">
                        {availableNamespaces.map(ns => <option key={ns} value={ns} className="bg-surface-1 text-white">{ns}</option>)}
                    </select>
                </div>
            )}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsSyncModalOpen(true)} className="flex items-center gap-2 bg-blue-500/10 text-blue-400 px-6 py-2.5 rounded-xl font-bold hover:bg-blue-500/20 transition-all border border-blue-500/20"><Cloud className="w-4 h-4" /> Bridge</button>
          <button onClick={() => { setProjectState(null); setSelectedItem(null); }} className="btn btn-ghost">Cerrar</button>
          <button onClick={() => exportEcosystem(projectState)} className="flex items-center gap-2 bg-accent text-white px-8 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-accent/20"><Download className="w-4 h-4" /> ZIP</button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
        <aside className="col-span-3 panel flex flex-col overflow-hidden">
           {activeEditor === 'ia' && (
               <div className="p-4 border-b border-line flex gap-2 overflow-x-auto scrollbar-hide">
                  <button onClick={() => { setActiveCategory('items'); setSelectedItem(null); }} className={cn("px-4 py-2 text-[10px] font-semibold uppercase rounded-lg transition-all flex-shrink-0", activeCategory === 'items' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300")}>Ítems</button>
                  <button onClick={() => { setActiveCategory('blocks'); setSelectedItem(null); }} className={cn("px-4 py-2 text-[10px] font-semibold uppercase rounded-lg transition-all flex-shrink-0", activeCategory === 'blocks' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300")}>Bloques</button>
                  <button onClick={() => { setActiveCategory('furnitures'); setSelectedItem(null); }} className={cn("px-4 py-2 text-[10px] font-semibold uppercase rounded-lg transition-all flex-shrink-0", activeCategory === 'furnitures' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300")}>Muebles</button>
               </div>
           )}
           <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex gap-2">
                <div className="relative group flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-3 group-focus-within:text-accent transition-colors" />
                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar..." className="input pl-9" />
                </div>
                <button onClick={handleCreateNew} className="btn btn-primary px-2.5"><Plus className="w-5 h-5" /></button>
              </div>
              <div className="space-y-1">
                {activeEditor === 'ia' ? (
                    filteredItems.map(([id, entry]) => (
                        <div key={id} onClick={() => setSelectedItem(id)} className="row" data-selected={selectedItem === id}>
                            <span className="truncate flex-1">{id}</span>
                            <span className="badge badge-muted">{entry.fullKey.split('/')[1]}</span>
                        </div>
                    ))
                ) : (
                    Object.entries(groupedX).map(([folder, items]) => (
                        <div key={folder} className="space-y-1">
                            <button onClick={() => setOpenFolders(prev => ({ ...prev, [folder]: !prev[folder] }))} className="w-full flex items-center justify-between px-2 py-1 hover:bg-white/5 rounded-lg transition-colors group">
                                <div className="flex items-center gap-2">{openFolders[folder] ? <ChevronDown className="w-3 h-3 text-gray-500" /> : <ChevronRight className="w-3 h-3 text-gray-500" />}<span className="eyebrow group-hover:text-ink-2">{folder}</span></div>
                            </button>
                            {(openFolders[folder] || folder === "Raíz") && (
                                <div className="space-y-0.5 ml-2 border-l border-white/5 pl-2">
                                    {items.map(id => {
                                        const cfg: any = mapFor(projectState, activeEditor as PluginEditor)[id]?.config ?? {};
                                        const esComida = activeEditor === 'xfoods';
                                        const comestible = cfg.stats?.consumable ?? true;
                                        const conIA = !!projectState.iaItems[`${XFOODS_NAMESPACE}/${leafId(id)}`];
                                        return (
                                            <div key={id} onClick={() => setSelectedItem(id)} className="row group" data-selected={selectedItem === id}>
                                                <span className="truncate flex-1">{leafId(id)}</span>
                                                {esComida && (
                                                    <span className={cn("badge", comestible ? "badge-ok" : "badge-muted")}>
                                                        {comestible ? "comida" : "ingr."}
                                                    </span>
                                                )}
                                                {conIA && <span className="badge badge-ia">3D</span>}
                                                <button onClick={(e) => handleCloneItem(id, e)} title="Duplicar"
                                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all flex-none">
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))
                )}
              </div>
           </div>
        </aside>

        {/* EDITOR */}
        <main className="col-span-6 panel overflow-y-auto p-6">
           {selectedItem && selectedData ? (
             <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-10 pb-20">
                <div className="flex justify-between items-start border-b border-line pb-8">
                   <div className="flex gap-6 items-center flex-1">
                      <VisualPreview 
                        mcPath={activeEditor === 'ia' ? (selectedData.data.resource?.model_path || selectedData.data.resource?.textures?.[0]) : (activeEditor === 'xcrops' ? selectedData.config.seed?.material : selectedData.config.item?.material)} 
                        rawFiles={projectState.rawFiles} 
                        namespace={activeEditor === 'ia' ? (selectedNamespace || projectState.projectName) : XFOODS_NAMESPACE}
                      />
                      <div className="space-y-1 flex-1">
                         <label className="eyebrow px-1">Identificador del Ítem</label>
                         <h3 className="text-2xl font-semibold text-ink tracking-tight">{selectedItem}</h3>
                      </div>
                   </div>
                   <div className="flex flex-col gap-2">
                        {activeEditor !== 'ia' && (
                            <button onClick={() => setIsPublishModalOpen(true)} className="btn btn-ghost text-yellow-400"><Rocket className="w-3 h-3"/> Publicar en Descubrir</button>
                        )}
                        <button onClick={(e) => handleCloneItem(selectedItem, e)} className="btn btn-ghost"><Copy className="w-3 h-3"/> Clonar</button>
                        <button className="btn btn-danger"><Trash2 className="w-3 h-3"/> Borrar</button>
                   </div>
                </div>

                <div className="space-y-8">
                    <div className="space-y-6">
                        <div className="section-head is-first text-yellow-400"><Info /><h4 className="section-title">Ajustes Base</h4></div>
                        <div className={cn("grid gap-6", activeEditor === 'ia' ? "grid-cols-2" : "grid-cols-3")}>
                            <div className="space-y-2">
                                <label className="label">Nombre Display</label>
                                <input type="text" value={(activeEditor === 'ia' ? selectedData.data.display_name : selectedData.config['display-name']) || ''} onChange={(e) => updateField(activeEditor === 'ia' ? `${currentIAKeyName}.${selectedItem}.display_name` : 'config.display-name', e.target.value, activeEditor === 'ia' ? selectedData.fullKey : undefined)} className="input" />
                            </div>
                            <div className="space-y-2">
                                <label className="label">Material</label>
                                <AutocompleteInput
                                    value={(activeEditor === 'ia' ? selectedData.data.resource?.material : (activeEditor === 'xcrops' ? selectedData.config.seed?.material : selectedData.config.item?.material)) || ''}
                                    onChange={(val) => updateField(activeEditor === 'ia' ? `${currentIAKeyName}.${selectedItem}.resource.material` : (activeEditor === 'xcrops' ? 'config.seed.material' : 'config.item.material'), val, activeEditor === 'ia' ? selectedData.fullKey : undefined)}
                                    options={MATERIALS} strict placeholder="BREAD" className="input" />
                                {isIAEnabled && activeEditor !== 'ia' && (
                                    <p className="text-[10px] text-gray-500">Se aplica también al ítem de ItemsAdder, que es el que manda mientras la integración esté activa.</p>
                                )}
                            </div>
                            {(activeEditor === 'xfoods' || activeEditor === 'xcrops' || activeEditor === 'xmachines') && (
                                <div className="space-y-2">
                                    <label className="label">Custom Model Data</label>
                                    <input type="number" value={(activeEditor === 'xcrops' ? selectedData.config.seed?.['custom-model-data'] : selectedData.config.item?.['custom-model-data']) || 0} onChange={(e) => updateField(activeEditor === 'xcrops' ? 'config.seed.custom-model-data' : 'config.item.custom-model-data', parseInt(e.target.value))} className="input" />
                                </div>
                            )}
                        </div>
                    </div>

                    {activeEditor === 'xfoods' && (
                        <>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="bg-surface-2 p-3 rounded-[6px] border border-line"><label className="label">Nivel Comida</label><input type="number" value={selectedData.config.stats?.['food-level'] || 0} onChange={(e) => updateField('config.stats.food-level', parseInt(e.target.value))} className="input" /></div>
                            <div className="bg-surface-2 p-3 rounded-[6px] border border-line"><label className="label">Saturación</label><input type="number" step="0.1" value={selectedData.config.stats?.saturation || 0} onChange={(e) => updateField('config.stats.saturation', parseFloat(e.target.value))} className="input" /></div>
                            <div className="bg-surface-2 p-3 rounded-[6px] border border-line"><label className="label">Mordiscos</label><input type="number" value={selectedData.config.stats?.bites || 1} onChange={(e) => updateField('config.stats.bites', parseInt(e.target.value))} className="input" /></div>
                            <div className="bg-surface-2 p-3 rounded-[6px] border border-line"><label className="label">Ticks Consumo</label><input type="number" value={selectedData.config.stats?.['consumption-ticks'] || 30} onChange={(e) => updateField('config.stats.consumption-ticks', parseInt(e.target.value))} className="input" /></div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-start">
                            <div className="space-y-2 col-span-2">
                                <label className="label">¿Se puede comer?</label>
                                <button
                                    type="button"
                                    onClick={() => updateField('config.stats.consumable', !(selectedData.config.stats?.consumable ?? true))}
                                    className={cn("w-full rounded-xl px-4 py-3 text-left text-sm font-bold border transition-colors",
                                        (selectedData.config.stats?.consumable ?? true)
                                            ? "bg-green-500/10 border-green-500/40 text-green-300"
                                            : "bg-surface-0 border-line text-gray-400")}>
                                    {(selectedData.config.stats?.consumable ?? true) ? "Sí — es una comida" : "No — es un ingrediente"}
                                </button>
                                <p className="hint">Los ingredientes (carne cruda, queso, lechuga…) deben ir en «No»: si no, el jugador se los come directamente en vez de usarlos en una máquina.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="label">Máximo por pila</label>
                                <input type="number" min={1} max={99} value={selectedData.config.item?.['max-stack'] ?? 64} onChange={(e) => updateField('config.item.max-stack', parseInt(e.target.value))} className="input" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="label">Sonido al comer</label>
                                <AutocompleteInput value={selectedData.config.effects?.sound || ''} onChange={(val) => updateField('config.effects.sound', val)} options={SOUNDS} strict placeholder="ENTITY_GENERIC_EAT" className="input" />
                            </div>
                            <div className="space-y-2">
                                <label className="label">Partícula</label>
                                <AutocompleteInput value={selectedData.config.effects?.particle || ''} onChange={(val) => updateField('config.effects.particle', val)} options={PARTICLES} strict placeholder="HAPPY_VILLAGER"
                                    hint={String(selectedData.config.effects?.particle || '') === 'VILLAGER_HAPPY' ? 'VILLAGER_HAPPY se renombró a HAPPY_VILLAGER en 1.20.5.' : undefined}
                                    className="input" />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            {(['proteins','carbs','sugars','vitamins'] as const).map(k => (
                                <div key={k} className="bg-surface-2 p-3 rounded-[6px] border border-line">
                                    <label className="label">{k}</label>
                                    <input type="number" value={(selectedData.config.nutrition as any)?.[k] ?? 0} onChange={(e) => updateField(`config.nutrition.${k}`, parseInt(e.target.value))} className="input" />
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <label className="label">Lore</label>
                            <textarea rows={4} value={Array.isArray(selectedData.config.lore) ? selectedData.config.lore.join('\n') : ''} onChange={(e) => updateField('config.lore', e.target.value)} className="input" />
                        </div>
                        <div className="space-y-6">
                            <div className="section-head text-orange-400"><Clock /><h4 className="section-title">Expiración</h4></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><label className="label">Minutos</label><input type="number" value={selectedData.config.stats?.['expiry-minutes'] || 0} onChange={(e) => updateField('config.stats.expiry-minutes', parseInt(e.target.value))} className="input" /></div>
                                <div className="space-y-2"><label className="label">ID al Caducar</label><AutocompleteInput value={selectedData.config.stats?.['expired-id'] || ''} onChange={(val) => updateField('config.stats.expired-id', val)} options={foodIdOptions} className="input" /></div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="section-head text-red-400"><Binary /><h4 className="section-title">Integración RPXHealth</h4></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><label className="label">ID Enfermedad</label><input type="text" value={selectedData.config.integration?.['disease-id'] || ''} onChange={(e) => updateField('config.integration.disease-id', e.target.value)} className="input" /></div>
                                <div className="space-y-2"><label className="label">Probabilidad</label><input type="number" step="0.01" value={selectedData.config.integration?.['disease-chance'] || 0} onChange={(e) => updateField('config.integration.disease-chance', parseFloat(e.target.value))} className="input" /></div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="section-head text-pink-400"><Zap /><h4 className="section-title">Efectos de Poción (Subidón / Bajón)</h4></div>
                            <PotionEffectsEditor
                                potion={(selectedData.config.effects?.potion as PotionConfig) || {}}
                                mutate={(fn) => mutateSelectedConfig((cfg) => {
                                    if (!cfg.effects) cfg.effects = {};
                                    if (!cfg.effects.potion) cfg.effects.potion = {};
                                    fn(cfg.effects.potion);
                                })}
                            />
                        </div>
                        <div className="space-y-6">
                             <div className="section-head justify-between text-ok"><h4 className="section-title">Comandos</h4><button onClick={() => { const newState = {...projectState}; const food = (newState.foods[selectedItem as string].config as any); if(!food.commands) food.commands = []; (food.commands as any).push(""); setProjectState(newState); }} className="text-[10px] font-bold text-green-400">+ AÑADIR</button></div>
                             <p className="hint -mt-2">Para dar efectos de poción usa la sección de arriba. Usa esto solo para mensajes u otros comandos (dar ítems, dinero, teletransportar, etc.).</p>
                             <div className="space-y-2">{(Array.isArray(selectedData.config.commands) ? selectedData.config.commands : []).map((cmd: string, idx: number) => (
                                <CommandActionRow
                                    key={idx}
                                    value={cmd}
                                    onChange={(newRaw) => { const newState = {...projectState}; (newState.foods[selectedItem as string].config.commands as any)[idx] = newRaw; setProjectState(newState); }}
                                    onRemove={() => { const newState = {...projectState}; (newState.foods[selectedItem as string].config.commands as any).splice(idx, 1); setProjectState(newState); }}
                                />
                             ))}</div>
                        </div>
                        </>
                    )}

                    {activeEditor === 'xcrops' && (
                         <div className="space-y-8">
                             <div className="space-y-6">
                                <div className="section-head text-lime-400"><Sprout /><h4 className="section-title">Semilla</h4></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><label className="label">Nombre de la Semilla</label><input type="text" value={selectedData.config.seed?.['display-name'] || ''} onChange={(e) => updateField('config.seed.display-name', e.target.value)} className="input" /></div>
                                    <div className="space-y-2"><label className="label">ItemsAdder ID (semilla)</label><input type="text" value={selectedData.config.seed?.['itemsadder-id'] || ''} onChange={(e) => updateField('config.seed.itemsadder-id', e.target.value)} placeholder="opcional" className="input" /></div>
                                </div>
                                <div className="space-y-2"><label className="label">Lore de la Semilla</label><textarea rows={3} value={Array.isArray(selectedData.config.seed?.lore) ? selectedData.config.seed.lore.join('\n') : ''} onChange={(e) => updateField('config.seed.lore', e.target.value)} className="input" /></div>
                                <div className="space-y-2">
                                    <label className="label">ID de Vínculo (requirements.seed-nbt)</label>
                                    <input type="text" value={selectedData.config.requirements?.['seed-nbt'] || ''} onChange={(e) => updateField('config.requirements.seed-nbt', e.target.value)} placeholder={selectedItem || ''} className="input" />
                                    <p className="hint">Lo natural es que coincida con el identificador &quot;{selectedItem}&quot;. El plugin resuelve la semilla por ambos, así que un valor distinto también funciona.</p>
                                </div>
                             </div>

                             <div className="space-y-6">
                                <div className="section-head text-green-400"><FolderSearch /><h4 className="section-title">Etapas de Crecimiento</h4></div>
                                <CropStagesEditor
                                    stages={(selectedData.config.growth?.stages as Record<string, any>) || {}}
                                    mutate={(fn) => mutateSelectedConfig((cfg) => {
                                        if (!cfg.growth) cfg.growth = {};
                                        if (!cfg.growth.stages) cfg.growth.stages = {};
                                        fn(cfg.growth.stages);
                                    })}
                                />
                             </div>

                             <div className="space-y-6">
                                <div className="section-head text-purple-400"><Clock /><h4 className="section-title">Marchitamiento y Visuales</h4></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><label className="label">Marchita sin nutrientes tras (segundos)</label><input type="number" value={selectedData.config.growth?.['wither-time'] ?? 2400} onChange={(e) => updateField('config.growth.wither-time', parseInt(e.target.value))} className="input" /></div>
                                    <div className="space-y-2"><label className="label">Título del Holograma</label><input type="text" value={selectedData.config.visuals?.['hologram-title'] || ''} onChange={(e) => updateField('config.visuals.hologram-title', e.target.value)} placeholder="&fPlanta" className="input" /></div>
                                </div>
                             </div>

                             <div className="space-y-6">
                                <div className="section-head text-yellow-400"><Sprout /><h4 className="section-title">Cosecha</h4></div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2 col-span-2"><label className="label">Ítem xFoods al Cosechar</label><AutocompleteInput value={selectedData.config.harvest?.['xfoods-id'] || ''} onChange={(val) => updateField('config.harvest.xfoods-id', val)} options={foodIdOptions} className="input" /></div>
                                    <div className="space-y-2"><label className="label">Cantidad</label><input type="number" min={1} value={selectedData.config.harvest?.amount ?? 1} onChange={(e) => updateField('config.harvest.amount', parseInt(e.target.value))} className="input" /></div>
                                </div>
                                <div className="space-y-2"><label className="label">Mensaje al Cosechar</label><input type="text" value={selectedData.config.harvest?.message || ''} onChange={(e) => updateField('config.harvest.message', e.target.value)} placeholder="&aCosechado." className="input" /></div>
                             </div>
                         </div>
                    )}

                    {activeEditor === 'xpods' && (
                        <div className="space-y-6">
                            <div className="section-head text-lime-400"><Flower2 /><h4 className="section-title">Modificadores del Macetero</h4></div>
                            <div className="grid grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="label">Velocidad de crecimiento</label>
                                    <input type="number" step="0.05" min={0.05} value={(selectedData.config.modifiers as any)?.['growth-speed'] ?? 1.0} onChange={(e) => updateField('config.modifiers.growth-speed', parseFloat(e.target.value))} className="input" />
                                    <p className="hint">1.0 = duración tal cual la define la especie. 2.0 = el doble de rápido.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="label">Consumo de nutrientes</label>
                                    <input type="number" step="0.1" min={0} value={(selectedData.config.modifiers as any)?.['nutrient-rate'] ?? 1.0} onChange={(e) => updateField('config.modifiers.nutrient-rate', parseFloat(e.target.value))} className="input" />
                                    <p className="hint">Multiplica la pérdida de calidad por descuido. Menos de 1.0 = perdona.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="label">Multiplicador de cosecha</label>
                                    <input type="number" step="0.1" min={0.1} value={(selectedData.config.modifiers as any)?.yield ?? 1.0} onChange={(e) => updateField('config.modifiers.yield', parseFloat(e.target.value))} className="input" />
                                </div>
                            </div>
                            <div className="space-y-2 max-w-sm">
                                <label className="label">Probabilidad de plaga (por minuto)</label>
                                <input type="number" step="0.01" min={0} max={1} value={(selectedData.config.probabilities as any)?.['pest-chance'] ?? 0.05} onChange={(e) => updateField('config.probabilities.pest-chance', parseFloat(e.target.value))} className="input" />
                                <p className="hint">Entre 0.0 y 1.0. Con 0.05 la planta tiene un 5% de infectarse cada minuto.</p>
                            </div>
                        </div>
                    )}

                    {activeEditor === 'xautomation' && (
                        <div className="space-y-6">
                            <div className="section-head text-cyan-400"><Cpu /><h4 className="section-title">Máquina de Automatización</h4></div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="label">Tipo</label>
                                    <select value={(selectedData.config.type as string) || 'AUTO_WATERER'} onChange={(e) => updateField('config.type', e.target.value)} className="input">
                                        {AUTOMATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    {selectedData.config.type === 'SMART_LIGHT' && (selectedData.config.item as any)?.material !== 'REDSTONE_LAMP' && (
                                        <p className="hint text-danger">SMART_LIGHT solo funciona con material REDSTONE_LAMP: el plugin enciende y apaga el bloque, y solo sabe hacerlo con lámparas de redstone.</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="label">Radio de acción (bloques)</label>
                                    <input type="number" min={1} value={(selectedData.config.range as number) ?? 5} onChange={(e) => updateField('config.range', parseInt(e.target.value))} className="input" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="label">Combustible: comida xFoods</label>
                                    <AutocompleteInput value={((selectedData.config.fuel as any)?.['xfoods-id']) || ''} onChange={(val) => updateField('config.fuel.xfoods-id', val)} options={foodIdOptions} className="input" />
                                </div>
                                <div className="space-y-2">
                                    <label className="label">…o material de vanilla</label>
                                    <AutocompleteInput value={((selectedData.config.fuel as any)?.material) || ''} onChange={(val) => updateField('config.fuel.material', val)} options={MATERIALS} strict placeholder="BONE_MEAL" className="input" />
                                </div>
                                <div className="space-y-2">
                                    <label className="label">Gasto por acción</label>
                                    <input type="number" min={1} value={((selectedData.config.fuel as any)?.['consume-per-action']) ?? 1} onChange={(e) => updateField('config.fuel.consume-per-action', parseInt(e.target.value))} className="input" />
                                </div>
                            </div>
                            <div className="space-y-2 max-w-xs">
                                <label className="label">Huecos de almacén</label>
                                <input type="number" min={1} value={(selectedData.config['storage-slots'] as number) ?? 9} onChange={(e) => updateField('config.storage-slots', parseInt(e.target.value))} className="input" />
                                <p className="hint">Lo usa el recolector para guardar la cosecha, y limita cuánto combustible cabe.</p>
                            </div>
                        </div>
                    )}

                    {activeEditor === 'xmachines' && (
                         <div className="space-y-8">
                            <div className="section-head text-orange-400"><Flame /><h4 className="section-title">Recetas de la Estación</h4></div>
                            <MachineRecipesEditor
                                config={selectedData.config as { 'is-refrigerator'?: boolean; recipes?: Record<string, any> }}
                                mutate={mutateSelectedConfig}
                                foodOptions={foodIdOptions}
                            />
                         </div>
                    )}

                    {activeEditor === 'ia' && (
                        <div className="space-y-8">
                            <div
                                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                onDrop={handleIAFileUpload}
                                className="bg-surface-0 p-8 rounded-3xl border-2 border-dashed border-white/5 space-y-6 transition-colors hover:border-yellow-400/30"
                            >
                                <div className="flex justify-between items-center"><h4 className="eyebrow">Recursos <span className="text-gray-600 normal-case font-medium">(arrastra .png / .json aquí)</span></h4><button onClick={() => iaFileInputRef.current?.click()} className="badge badge-ia">Inyectar</button><input type="file" ref={iaFileInputRef} onChange={handleIAFileUpload} className="hidden" accept=".png,.json" multiple /></div>
                                <div className="space-y-4">
                                    <div className="space-y-2"><label className="label">Ruta Modelo</label><input type="text" value={selectedData.data.resource?.model_path || ''} onChange={(e) => updateField(`${currentIAKeyName}.${selectedItem}.resource.model_path`, e.target.value, selectedData.fullKey)} className="input" /></div>
                                    <label className="flex items-center gap-3 cursor-pointer"><div className="relative"><input type="checkbox" checked={selectedData.data.resource?.generate || false} onChange={(e) => updateField(`${currentIAKeyName}.${selectedItem}.resource.generate`, e.target.checked, selectedData.fullKey)} className="sr-only" /><div className={cn("w-8 h-4 rounded-full transition-colors", selectedData.data.resource?.generate ? "bg-green-500" : "bg-gray-700")}></div><div className={cn("absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform", selectedData.data.resource?.generate ? "translate-x-4" : "")}></div></div><span className="eyebrow">Auto-Gen 2D</span></label>
                                </div>
                            </div>

                            <div className="bg-surface-0 p-8 rounded-3xl border border-white/5 space-y-6">
                                <div className="section-head text-green-400"><CheckCircle2 /><h4 className="section-title">Estado y Permisos</h4></div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="label">Permiso de Colocación</label>
                                        <input type="text" value={selectedData.data.permission || ''} onChange={(e) => updateField(`${currentIAKeyName}.${selectedItem}.permission`, e.target.value, selectedData.fullKey)} className="input" />
                                    </div>
                                    <div className="flex items-center h-full pt-6">
                                        <label className="flex items-center gap-3 cursor-pointer group/enabled">
                                            <div className="relative">
                                                <input type="checkbox" checked={selectedData.data.enabled ?? true} onChange={(e) => updateField(`${currentIAKeyName}.${selectedItem}.enabled`, e.target.checked, selectedData.fullKey)} className="sr-only" />
                                                <div className={cn("w-8 h-4 rounded-full transition-colors", (selectedData.data.enabled ?? true) ? "bg-green-500" : "bg-gray-700")}></div>
                                                <div className={cn("absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform", (selectedData.data.enabled ?? true) ? "translate-x-4" : "")}></div>
                                            </div>
                                            <span className="eyebrow">Habilitado</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {activeCategory === 'furnitures' && (
                                <>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-surface-0 p-6 rounded-2xl border border-white/5 space-y-4">
                                        <h4 className="section-title">Tipo de Mueble</h4>
                                        {/* "entity" es una propiedad PLANA de behaviours.furniture, en minúsculas
                                            (armor_stand/item_frame/item_display/glow_item_frame). No existe una
                                            clave "furniture_type" ni una sección anidada por tipo: ver docs
                                            oficiales en wiki.itemsadder.com/adding-content/furnitures/example. */}
                                        <select
                                            value={selectedData.data.behaviours?.furniture?.entity || 'armor_stand'}
                                            onChange={(e) => {
                                                const newEntity = e.target.value;
                                                const newState = { ...projectState } as EcosystemState;
                                                const config = newState.iaFurnitures[selectedData.fullKey] as Record<string, any>;
                                                const item = config.items[selectedItem as string];

                                                if (!item.behaviours) item.behaviours = { furniture: {} };
                                                item.behaviours.furniture.entity = newEntity;

                                                // "small" solo es relevante para armor_stand.
                                                if (newEntity === 'armor_stand') {
                                                    item.behaviours.furniture.small = true;
                                                } else {
                                                    delete item.behaviours.furniture.small;
                                                }
                                                setProjectState(newState);
                                            }}
                                            className="input"
                                        >
                                            <option value="armor_stand">armor_stand (Suelo/Cajas)</option>
                                            <option value="item_frame">item_frame (Pared/Planos)</option>
                                            <option value="glow_item_frame">glow_item_frame (Pared Brillante)</option>
                                            <option value="item_display">item_display (Libre, escalable/rotable)</option>
                                        </select>
                                    </div>
                                    <div className="bg-surface-0 p-6 rounded-2xl border border-white/5 space-y-4">
                                        <h4 className="section-title">Hitbox (Colisión)</h4>
                                        <div className="grid grid-cols-3 gap-3">
                                            {['length', 'width', 'height'].map(dim => (
                                                <div key={dim} className="bg-black/20 p-2 rounded-lg border border-white/5">
                                                    <label className="label">{dim}</label>
                                                    <input type="number" step="0.1" value={selectedData.data.behaviours?.furniture?.hitbox?.[dim] || 1} onChange={(e) => updateField(`items.${selectedItem}.behaviours.furniture.hitbox.${dim}`, parseFloat(e.target.value), selectedData.fullKey)} className="input" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-surface-0 p-6 rounded-2xl border border-white/5 space-y-4">
                                        <h4 className="section-title">Interacción</h4>
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <label className="label">Nivel Luz (0-15)</label>
                                                <input type="number" min="0" max="15" value={selectedData.data.behaviours?.furniture?.light_level || 0} onChange={(e) => updateField(`items.${selectedItem}.behaviours.furniture.light_level`, parseInt(e.target.value), selectedData.fullKey)} className="input" />
                                            </div>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={selectedData.data.behaviours?.furniture?.solid || false} onChange={(e) => updateField(`items.${selectedItem}.behaviours.furniture.solid`, e.target.checked, selectedData.fullKey)} className="rounded bg-black border-white/10 text-purple-400" />
                                                <span className="eyebrow">Sólido (hitbox de barreras)</span>
                                            </label>
                                        </div>
                                    </div>
                                    {selectedData.data.behaviours?.furniture?.entity === 'item_frame' && (
                                        <div className="bg-surface-0 p-6 rounded-2xl border border-white/5 space-y-4">
                                            <h4 className="section-title">Colocable en</h4>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['walls', 'ceiling', 'floor'].map(side => (
                                                    <label key={side} className="flex items-center gap-2 cursor-pointer group/opt">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedData.data.behaviours?.furniture?.placeable_on?.[side] ?? (side === 'walls')}
                                                            onChange={(e) => updateField(`items.${selectedItem}.behaviours.furniture.placeable_on.${side}`, e.target.checked, selectedData.fullKey)}
                                                            className="rounded bg-black border-white/10 text-purple-400"
                                                        />
                                                        <span className="label mb-0 group-hover/opt:text-ink transition-colors">{side}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {(activeEditor === 'xfoods' || activeEditor === 'xcrops' || activeEditor === 'xmachines') && (
                <div className={cn("p-8 rounded-3xl border transition-all space-y-6", isIAEnabled ? "bg-yellow-400/5 border-yellow-400/20" : "bg-white/2 border-white/5")}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3"><Settings2 className={cn("w-6 h-6", isIAEnabled ? "text-yellow-400" : "text-gray-600")} /><div><h4 className="text-[13px] font-semibold text-ink">ItemsAdder</h4><p className="eyebrow">Modelos 3D y texturas</p></div></div>
                        {activeEditor === 'xmachines' ? (
                            <div className="flex gap-1 bg-black/20 p-1 rounded-lg border border-white/5">
                                <button type="button" onClick={() => updateField('ia-toggle', false)} className={cn("px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-colors", !isIAEnabled ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300")}>Ninguno</button>
                                <button type="button" onClick={() => updateField('ia-toggle', true)} className={cn("px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-colors", iaKind === 'item' ? "bg-yellow-400/20 text-yellow-400" : "text-gray-500 hover:text-gray-300")}>Ítem</button>
                                <button type="button" onClick={() => updateField('ia-toggle', 'furniture')} className={cn("px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-colors", iaKind === 'furniture' ? "bg-yellow-400/20 text-yellow-400" : "text-gray-500 hover:text-gray-300")}>Mueble</button>
                            </div>
                        ) : (
                            <label className="switch"><input type="checkbox" checked={isIAEnabled} onChange={(e) => updateField('ia-toggle', e.target.checked)} /><span className="slider"></span></label>
                        )}
                    </div>
                    {activeEditor === 'xmachines' && isIAEnabled && (
                        <p className="text-[10px] text-gray-500 -mt-2">
                            {iaKind === 'furniture'
                                ? "Mueble: el modelo 3D también se ve colocado en el mundo. Se coloca y se rompe como un mueble de ItemsAdder, no como un bloque."
                                : "Ítem: el modelo 3D solo se ve sostenido/en el inventario. Colocada se ve como el Material de arriba — usa uno colocable si quieres poder plantarla en el mundo."}
                        </p>
                    )}
                    {activeEditor === 'xmachines' && iaKind === 'furniture' && (
                        <div className="space-y-2">
                            <label className="label">Tipo de Mueble</label>
                            <select
                                value={linkedIaFurnitureEntry?.behaviours?.furniture?.entity || 'armor_stand'}
                                onChange={(e) => updateLinkedFurnitureType(e.target.value)}
                                className="input"
                            >
                                <option value="armor_stand">armor_stand (Suelo/Cajas)</option>
                                <option value="item_frame">item_frame (Pared/Planos)</option>
                                <option value="glow_item_frame">glow_item_frame (Pared Brillante)</option>
                                <option value="item_display">item_display (Libre, escalable/rotable)</option>
                            </select>
                        </div>
                    )}
                    {isIAEnabled && (
                        <div
                            onClick={() => iaFileInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDrop={handleIAFileUpload}
                            className="border-2 border-dashed border-yellow-400/20 rounded-2xl p-10 text-center hover:border-yellow-400/40 hover:bg-yellow-400/5 transition-all group cursor-pointer relative"
                        >
                            <input type="file" ref={iaFileInputRef} onChange={handleIAFileUpload} className="hidden" accept=".png,.json" multiple />
                            <div className="bg-yellow-400/10 p-4 rounded-full w-fit mx-auto mb-4 group-hover:scale-110 transition-transform"><Upload className="w-8 h-8 text-yellow-400" /></div>
                            <h4 className="text-white font-bold text-sm">Cargar Modelo / Textura / JSON</h4>
                            <p className="hint mt-2">
                                Arrastra o haz clic para subir .png / .json <br/>
                                <span className="text-yellow-400/50">se auto-configura para "{selectedItem}"</span>
                            </p>
                            {linkedIaEntry?.resource?.model_path && (
                                <p className="mt-4 text-[10px] font-mono text-green-400 truncate">{linkedIaEntry.resource.model_path}</p>
                            )}
                        </div>
                    )}
                </div>
                )}
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30 grayscale scale-95 transition-all py-20"><div className="bg-white/5 p-10 rounded-full border border-white/5 animate-pulse"><Package className="w-20 h-20 text-gray-700" /></div><div className="space-y-2"><h3 className="text-lg font-medium text-ink-2">Selecciona un elemento</h3><p className="text-[13px] text-ink-3">Explora las categorías para iniciar la edición profesional.</p></div></div>
           )}
        </main>

        <section className="col-span-3 panel overflow-hidden flex flex-col lg:sticky lg:top-0 h-fit max-h-[90vh]">
           <div className="bg-surface-1 px-4 py-3 border-b border-line flex items-center justify-between"><div className="flex items-center gap-2"><Binary className="w-4 h-4 text-accent" /><span className="hint">Live Code</span></div><div className="flex gap-2"><button onClick={() => setActivePreview('plugin')} className={cn("text-[9px] font-semibold px-2 py-0.5 rounded border transition-all", activePreview === 'plugin' ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" : "text-gray-600 border-transparent")}>PLUGIN</button><button disabled={!isIAEnabled && activeEditor !== 'ia'} onClick={() => setActivePreview('ia')} className={cn("text-[9px] font-semibold px-2 py-0.5 rounded border transition-all disabled:opacity-0", activePreview === 'ia' ? "text-blue-400 bg-blue-400/10 border-blue-400/20" : "text-gray-600 border-transparent")}>IA</button></div></div>
           <div className="flex-1 p-6 overflow-auto font-mono text-[12px] text-blue-200 leading-relaxed scrollbar-hide">
               <pre className="whitespace-pre-wrap break-words">
                   {selectedItem && selectedData ? (
                       activePreview === 'plugin' ? stringifyYaml(activeEditor === 'ia' ? selectedData.data : selectedData.config) : 
                       (activeEditor === 'ia' ? stringifyYaml(
                           activeCategory === 'items' ? projectState.iaItems[selectedData.fullKey] : 
                           (activeCategory === 'blocks' ? projectState.iaBlocks[selectedData.fullKey] : projectState.iaFurnitures[selectedData.fullKey])
                       ) : (projectState.iaItems[`${XFOODS_NAMESPACE}/${leafId(selectedItem)}`] ? stringifyYaml(projectState.iaItems[`${XFOODS_NAMESPACE}/${leafId(selectedItem)}`]) : "# No hay config de IA"))
                   ) : "# Selecciona un ítem..."}
               </pre>
           </div>
           <div className="p-4 bg-surface-1 border-t border-line"><button onClick={() => { if (selectedItem && selectedData) { const yaml = activePreview === 'plugin' ? stringifyYaml(activeEditor === 'ia' ? selectedData.data : selectedData.config) : stringifyYaml(projectState.iaItems[`${XFOODS_NAMESPACE}/${leafId(selectedItem)}`]); navigator.clipboard.writeText(yaml || ""); alert("Copiado"); } }} className="btn btn-ghost w-full">Copiar Código</button></div>
        </section>
      </div>

      <SyncModal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} onSync={handleSyncToBridge} onImport={handleImportFromBridge} />
      {selectedItem && (
        <PublishModal isOpen={isPublishModalOpen} onClose={() => setIsPublishModalOpen(false)} itemId={selectedItem} onPublish={handlePublish} />
      )}
    </div>
  );
}
