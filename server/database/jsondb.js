import fs from 'fs';
import path from 'path';

export class JsonDB {
  constructor(collectionName, baseDir = path.join(process.cwd(), 'database', 'data')) {
    this.collectionName = collectionName;
    this.baseDir = baseDir;
    this.filePath = path.join(this.baseDir, `${collectionName}.json`);
    this.cache = [];
    this._init();
  }

  _init() {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      this._persist([]);
    } else {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.cache = JSON.parse(raw);
      } catch (err) {
        console.error(`[JsonDB] Erro ao carregar coleção ${this.collectionName}:`, err);
        this.cache = [];
      }
    }
  }

  _persist(data) {
    this.cache = data;
    const tempPath = `${this.filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(this.cache, null, 2), 'utf-8');
    try {
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      // Fallback para Windows caso renameSync falhe com arquivo travado
      fs.copyFileSync(tempPath, this.filePath);
      try { fs.unlinkSync(tempPath); } catch (_) {}
    }
  }

  findAll(predicate) {
    return predicate ? this.cache.filter(predicate) : [...this.cache];
  }

  findById(id) {
    return this.cache.find(item => item.id === id) || null;
  }

  findOne(predicate) {
    return this.cache.find(predicate) || null;
  }

  insert(record) {
    const id = record.id || `${this.collectionName.slice(0, 3)}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const doc = {
      ...record,
      id,
      createdAt: record.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this._persist([...this.cache, doc]);
    return doc;
  }

  update(id, updates) {
    const idx = this.cache.findIndex(item => item.id === id);
    if (idx === -1) return null;
    const updated = {
      ...this.cache[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    const newCache = [...this.cache];
    newCache[idx] = updated;
    this._persist(newCache);
    return updated;
  }

  delete(id) {
    const initialLen = this.cache.length;
    const filtered = this.cache.filter(item => item.id !== id);
    if (filtered.length === initialLen) return false;
    this._persist(filtered);
    return true;
  }

  upsert(predicate, newRecord) {
    const existing = this.findOne(predicate);
    if (existing) {
      return this.update(existing.id, newRecord);
    } else {
      return this.insert(newRecord);
    }
  }
}
