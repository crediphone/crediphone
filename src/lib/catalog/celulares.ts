/**
 * Catálogo estático de marcas, modelos y capacidades para México.
 * Cubre las marcas más vendidas en el mercado nacional.
 * Usado en el formulario de nuevo producto para auto-sugerencia.
 */

export interface ModeloCelular {
  nombre: string;
  capacidades?: string[]; // RAM/almacenamiento combinations
}

export interface MarcaCelular {
  nombre: string;
  modelos: ModeloCelular[];
}

export const CATALOGO_CELULARES: MarcaCelular[] = [
  {
    nombre: "Samsung",
    modelos: [
      { nombre: "Galaxy A05", capacidades: ["4GB/64GB", "4GB/128GB"] },
      { nombre: "Galaxy A05s", capacidades: ["4GB/64GB", "4GB/128GB"] },
      { nombre: "Galaxy A06", capacidades: ["4GB/64GB", "4GB/128GB"] },
      { nombre: "Galaxy A15", capacidades: ["4GB/128GB", "6GB/128GB"] },
      { nombre: "Galaxy A15 5G", capacidades: ["4GB/128GB", "6GB/128GB"] },
      { nombre: "Galaxy A25 5G", capacidades: ["6GB/128GB", "8GB/256GB"] },
      { nombre: "Galaxy A35 5G", capacidades: ["6GB/128GB", "8GB/256GB"] },
      { nombre: "Galaxy A55 5G", capacidades: ["8GB/128GB", "8GB/256GB"] },
      { nombre: "Galaxy S23", capacidades: ["8GB/128GB", "8GB/256GB"] },
      { nombre: "Galaxy S23+", capacidades: ["8GB/256GB", "8GB/512GB"] },
      { nombre: "Galaxy S23 Ultra", capacidades: ["8GB/256GB", "12GB/512GB", "12GB/1TB"] },
      { nombre: "Galaxy S24", capacidades: ["8GB/128GB", "8GB/256GB"] },
      { nombre: "Galaxy S24+", capacidades: ["12GB/256GB", "12GB/512GB"] },
      { nombre: "Galaxy S24 Ultra", capacidades: ["12GB/256GB", "12GB/512GB", "12GB/1TB"] },
      { nombre: "Galaxy S24 FE", capacidades: ["8GB/128GB", "8GB/256GB"] },
      { nombre: "Galaxy Z Flip5", capacidades: ["8GB/256GB", "8GB/512GB"] },
      { nombre: "Galaxy Z Flip6", capacidades: ["12GB/256GB", "12GB/512GB"] },
      { nombre: "Galaxy Z Fold5", capacidades: ["12GB/256GB", "12GB/512GB", "12GB/1TB"] },
      { nombre: "Galaxy Z Fold6", capacidades: ["12GB/256GB", "12GB/512GB", "12GB/1TB"] },
      { nombre: "Galaxy M15 5G", capacidades: ["4GB/128GB", "6GB/128GB"] },
    ],
  },
  {
    nombre: "Apple",
    modelos: [
      { nombre: "iPhone 13", capacidades: ["4GB/128GB", "4GB/256GB", "4GB/512GB"] },
      { nombre: "iPhone 13 mini", capacidades: ["4GB/128GB", "4GB/256GB", "4GB/512GB"] },
      { nombre: "iPhone 13 Pro", capacidades: ["6GB/128GB", "6GB/256GB", "6GB/512GB", "6GB/1TB"] },
      { nombre: "iPhone 13 Pro Max", capacidades: ["6GB/128GB", "6GB/256GB", "6GB/512GB", "6GB/1TB"] },
      { nombre: "iPhone 14", capacidades: ["6GB/128GB", "6GB/256GB", "6GB/512GB"] },
      { nombre: "iPhone 14 Plus", capacidades: ["6GB/128GB", "6GB/256GB", "6GB/512GB"] },
      { nombre: "iPhone 14 Pro", capacidades: ["6GB/128GB", "6GB/256GB", "6GB/512GB", "6GB/1TB"] },
      { nombre: "iPhone 14 Pro Max", capacidades: ["6GB/128GB", "6GB/256GB", "6GB/512GB", "6GB/1TB"] },
      { nombre: "iPhone 15", capacidades: ["6GB/128GB", "6GB/256GB", "6GB/512GB"] },
      { nombre: "iPhone 15 Plus", capacidades: ["6GB/128GB", "6GB/256GB", "6GB/512GB"] },
      { nombre: "iPhone 15 Pro", capacidades: ["8GB/128GB", "8GB/256GB", "8GB/512GB", "8GB/1TB"] },
      { nombre: "iPhone 15 Pro Max", capacidades: ["8GB/256GB", "8GB/512GB", "8GB/1TB"] },
      { nombre: "iPhone 16", capacidades: ["8GB/128GB", "8GB/256GB", "8GB/512GB"] },
      { nombre: "iPhone 16 Plus", capacidades: ["8GB/128GB", "8GB/256GB", "8GB/512GB"] },
      { nombre: "iPhone 16 Pro", capacidades: ["8GB/128GB", "8GB/256GB", "8GB/512GB", "8GB/1TB"] },
      { nombre: "iPhone 16 Pro Max", capacidades: ["8GB/256GB", "8GB/512GB", "8GB/1TB"] },
      { nombre: "iPhone SE (3ra Gen)", capacidades: ["4GB/64GB", "4GB/128GB", "4GB/256GB"] },
    ],
  },
  {
    nombre: "Motorola",
    modelos: [
      { nombre: "Moto G04", capacidades: ["4GB/64GB", "4GB/128GB"] },
      { nombre: "Moto G04s", capacidades: ["4GB/64GB", "4GB/128GB"] },
      { nombre: "Moto G14", capacidades: ["4GB/128GB"] },
      { nombre: "Moto G24", capacidades: ["4GB/128GB", "8GB/128GB"] },
      { nombre: "Moto G24 Power", capacidades: ["8GB/256GB"] },
      { nombre: "Moto G34 5G", capacidades: ["4GB/128GB", "8GB/256GB"] },
      { nombre: "Moto G54 5G", capacidades: ["8GB/256GB"] },
      { nombre: "Moto G64 5G", capacidades: ["8GB/256GB", "12GB/256GB"] },
      { nombre: "Moto G84 5G", capacidades: ["12GB/256GB"] },
      { nombre: "Moto G85 5G", capacidades: ["12GB/256GB"] },
      { nombre: "Moto Edge 50 Neo", capacidades: ["12GB/256GB"] },
      { nombre: "Moto Edge 50 Fusion", capacidades: ["8GB/256GB", "12GB/256GB"] },
      { nombre: "Moto Edge 50 Pro", capacidades: ["12GB/512GB"] },
      { nombre: "Moto Edge 50 Ultra", capacidades: ["12GB/512GB"] },
      { nombre: "Razr 50", capacidades: ["8GB/256GB"] },
      { nombre: "Razr 50 Ultra", capacidades: ["12GB/512GB"] },
    ],
  },
  {
    nombre: "Xiaomi",
    modelos: [
      { nombre: "Redmi 13C", capacidades: ["4GB/128GB", "6GB/128GB"] },
      { nombre: "Redmi 13", capacidades: ["6GB/128GB", "8GB/256GB"] },
      { nombre: "Redmi Note 13", capacidades: ["6GB/128GB", "8GB/256GB"] },
      { nombre: "Redmi Note 13 Pro", capacidades: ["8GB/256GB", "12GB/512GB"] },
      { nombre: "Redmi Note 13 Pro+", capacidades: ["8GB/256GB", "12GB/512GB"] },
      { nombre: "Redmi Note 13 5G", capacidades: ["6GB/128GB", "8GB/256GB"] },
      { nombre: "Redmi Note 14", capacidades: ["8GB/256GB"] },
      { nombre: "Redmi Note 14 Pro", capacidades: ["8GB/256GB", "12GB/512GB"] },
      { nombre: "Xiaomi 14", capacidades: ["12GB/256GB", "12GB/512GB"] },
      { nombre: "Xiaomi 14 Ultra", capacidades: ["16GB/512GB"] },
      { nombre: "Xiaomi 14T", capacidades: ["12GB/256GB", "12GB/512GB"] },
      { nombre: "Xiaomi 14T Pro", capacidades: ["12GB/512GB", "16GB/1TB"] },
      { nombre: "POCO X6 Pro", capacidades: ["8GB/256GB", "12GB/512GB"] },
      { nombre: "POCO F6", capacidades: ["12GB/256GB", "12GB/512GB"] },
      { nombre: "POCO F6 Pro", capacidades: ["12GB/512GB"] },
    ],
  },
  {
    nombre: "OPPO",
    modelos: [
      { nombre: "A18", capacidades: ["4GB/128GB"] },
      { nombre: "A38", capacidades: ["4GB/128GB"] },
      { nombre: "A58", capacidades: ["6GB/128GB"] },
      { nombre: "A78 5G", capacidades: ["8GB/128GB"] },
      { nombre: "A79 5G", capacidades: ["8GB/256GB"] },
      { nombre: "Reno11 F", capacidades: ["8GB/256GB"] },
      { nombre: "Reno12 F", capacidades: ["8GB/256GB"] },
      { nombre: "Find X7 Ultra", capacidades: ["16GB/512GB"] },
    ],
  },
  {
    nombre: "vivo",
    modelos: [
      { nombre: "Y17s", capacidades: ["4GB/128GB"] },
      { nombre: "Y27s", capacidades: ["8GB/128GB"] },
      { nombre: "Y36", capacidades: ["8GB/128GB", "8GB/256GB"] },
      { nombre: "Y100", capacidades: ["8GB/256GB"] },
      { nombre: "V29e", capacidades: ["8GB/256GB"] },
      { nombre: "V29 Lite", capacidades: ["8GB/128GB"] },
      { nombre: "V40 Lite", capacidades: ["8GB/256GB"] },
      { nombre: "X90 Pro", capacidades: ["12GB/256GB"] },
    ],
  },
  {
    nombre: "Huawei",
    modelos: [
      { nombre: "nova 11i", capacidades: ["8GB/128GB"] },
      { nombre: "nova 12i", capacidades: ["8GB/128GB"] },
      { nombre: "nova Y61", capacidades: ["4GB/64GB", "6GB/64GB"] },
      { nombre: "Y9s", capacidades: ["6GB/128GB"] },
      { nombre: "Pura 70 Pro", capacidades: ["12GB/512GB"] },
    ],
  },
  {
    nombre: "Realme",
    modelos: [
      { nombre: "C55", capacidades: ["6GB/128GB", "8GB/256GB"] },
      { nombre: "C67", capacidades: ["6GB/128GB", "8GB/256GB"] },
      { nombre: "Note 50", capacidades: ["4GB/128GB"] },
      { nombre: "12 Pro", capacidades: ["8GB/256GB", "12GB/512GB"] },
      { nombre: "12 Pro+", capacidades: ["12GB/512GB"] },
    ],
  },
  {
    nombre: "ZTE",
    modelos: [
      { nombre: "Blade A54", capacidades: ["4GB/64GB", "4GB/128GB"] },
      { nombre: "Blade A75", capacidades: ["4GB/128GB", "6GB/128GB"] },
      { nombre: "Blade V50 Vita", capacidades: ["8GB/256GB"] },
      { nombre: "Blade V50s", capacidades: ["8GB/256GB"] },
    ],
  },
  {
    nombre: "Alcatel",
    modelos: [
      { nombre: "1B 2022", capacidades: ["2GB/32GB"] },
      { nombre: "3L", capacidades: ["4GB/64GB"] },
      { nombre: "1V 2023", capacidades: ["2GB/32GB"] },
      { nombre: "Pulse Flex 2021", capacidades: ["2GB/32GB"] },
    ],
  },
  {
    nombre: "Nokia",
    modelos: [
      { nombre: "G22", capacidades: ["4GB/64GB", "4GB/128GB"] },
      { nombre: "G42 5G", capacidades: ["6GB/128GB"] },
      { nombre: "C32", capacidades: ["4GB/64GB"] },
      { nombre: "C110", capacidades: ["3GB/32GB"] },
    ],
  },
  {
    nombre: "OnePlus",
    modelos: [
      { nombre: "Nord CE 3 Lite 5G", capacidades: ["8GB/128GB", "8GB/256GB"] },
      { nombre: "Nord CE4 Lite", capacidades: ["8GB/256GB"] },
      { nombre: "12", capacidades: ["12GB/256GB", "16GB/512GB"] },
      { nombre: "12R", capacidades: ["8GB/128GB", "16GB/256GB"] },
    ],
  },
  {
    nombre: "TCL",
    modelos: [
      { nombre: "30 SE", capacidades: ["4GB/64GB"] },
      { nombre: "40 SE", capacidades: ["4GB/128GB", "6GB/256GB"] },
      { nombre: "40 NxtPaper", capacidades: ["6GB/256GB"] },
      { nombre: "50 SE", capacidades: ["6GB/256GB"] },
    ],
  },
  {
    nombre: "Honor",
    modelos: [
      { nombre: "X8b", capacidades: ["8GB/256GB"] },
      { nombre: "90 Smart", capacidades: ["4GB/128GB"] },
      { nombre: "Magic6 Pro", capacidades: ["12GB/512GB"] },
      { nombre: "Magic V2", capacidades: ["16GB/512GB"] },
    ],
  },
];

/** Todas las marcas ordenadas alfabéticamente */
export const MARCAS_CELULARES: string[] = CATALOGO_CELULARES.map((m) => m.nombre).sort();

/** Obtiene los modelos de una marca */
export function getModelosPorMarca(marca: string): ModeloCelular[] {
  const entry = CATALOGO_CELULARES.find(
    (m) => m.nombre.toLowerCase() === marca.toLowerCase()
  );
  return entry?.modelos ?? [];
}

/** Obtiene solo los nombres de modelos de una marca */
export function getNombresModelosPorMarca(marca: string): string[] {
  return getModelosPorMarca(marca).map((m) => m.nombre);
}

/** Obtiene las capacidades de un modelo específico */
export function getCapacidadesPorModelo(marca: string, modelo: string): string[] {
  const modelos = getModelosPorMarca(marca);
  const entry = modelos.find((m) => m.nombre.toLowerCase() === modelo.toLowerCase());
  return entry?.capacidades ?? [];
}

// ─── Inferencia de categoría desde nombre del producto ───────────────────────

interface ReglaCategoria {
  palabras: string[];
  categoria: string;
}

/** Reglas para inferir categoría desde el nombre del producto */
export const REGLAS_CATEGORIA: ReglaCategoria[] = [
  {
    palabras: ["cargador", "charger", "carga", "adaptador", "adapter", "fuente"],
    categoria: "Cargadores",
  },
  {
    palabras: ["cable", "usb", "lightning", "type-c", "tipo c", "typec", "micro usb"],
    categoria: "Cables",
  },
  {
    palabras: ["audifono", "auricular", "audifonos", "headphone", "earphone", "earbuds", "tws", "airpods", "buds"],
    categoria: "Audífonos",
  },
  {
    palabras: ["case", "funda", "protector", "cover", "estuche", "carcasa"],
    categoria: "Fundas y Cases",
  },
  {
    palabras: ["vidrio", "mica", "cristal", "templado", "screen protector", "protector pantalla"],
    categoria: "Micas y Vidrios",
  },
  {
    palabras: ["bateria", "batería", "battery", "power bank", "powerbank", "cargador portatil"],
    categoria: "Baterías",
  },
  {
    palabras: ["celular", "smartphone", "telefono", "teléfono", "iphone", "galaxy", "moto", "redmi"],
    categoria: "Celulares",
  },
  {
    palabras: ["tablet", "ipad", "tableta"],
    categoria: "Tablets",
  },
  {
    palabras: ["bocina", "speaker", "altavoz", "parlante"],
    categoria: "Bocinas",
  },
  {
    palabras: ["soporte", "holder", "mount", "montura", "stand", "base"],
    categoria: "Soportes y Accesorios",
  },
  {
    palabras: ["memoria", "sd", "microsd", "flash", "usb drive", "pendrive", "almacenamiento"],
    categoria: "Memorias y Almacenamiento",
  },
  {
    palabras: ["smartwatch", "reloj", "watch", "band", "pulsera inteligente"],
    categoria: "Smartwatches",
  },
  {
    palabras: ["pantalla", "display", "lcd", "oled", "screen"],
    categoria: "Pantallas",
  },
  {
    palabras: ["flex", "placa", "chip", "modulo", "pieza", "repuesto"],
    categoria: "Refacciones",
  },
  {
    palabras: ["limpiador", "spray", "limpia", "clean", "tela", "microfibra"],
    categoria: "Limpieza",
  },
];

/**
 * Infiere la categoría más probable dado un nombre de producto.
 * Retorna el nombre de la categoría sugerida, o null si no hay match.
 */
export function inferirCategoria(nombreProducto: string): string | null {
  const lower = nombreProducto.toLowerCase();

  for (const regla of REGLAS_CATEGORIA) {
    if (regla.palabras.some((palabra) => lower.includes(palabra))) {
      return regla.categoria;
    }
  }

  return null;
}

/**
 * Genera un SKU automático a partir de marca, modelo y un sufijo aleatorio.
 * Formato: MAR-MOD-XXXX (ej: SAM-A15-3F7A)
 */
export function generarSKU(marca?: string, modelo?: string): string {
  const prefMarca = (marca || "GEN").slice(0, 3).toUpperCase().replace(/\s+/g, "");
  const prefModelo = (modelo || "PRO")
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9]/gi, "")
    .slice(0, 4)
    .toUpperCase();
  const sufijo = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `${prefMarca}-${prefModelo}-${sufijo}`;
}
