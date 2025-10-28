<template>
  <div class="media-library">
    <!-- Filter -->
    <div class="media-filters">
      <button 
        v-for="type in mediaTypes" 
        :key="type.value"
        @click="selectedType = type.value"
        :class="{ active: selectedType === type.value }"
        class="filter-btn"
      >
        {{ type.label }}
      </button>
    </div>

    <!-- Mediagrid -->
    <div v-if="loading" class="loading">
      Laddar mediafiler...
    </div>
    
    <div v-else-if="filteredFiles.length === 0" class="no-files">
      Inga filer av denna typ hittades.
    </div>

    <div v-else class="media-grid">
      <div 
        v-for="file in filteredFiles" 
        :key="file.id"
        @click="selectFile(file)"
        :class="{ selected: selectedFile?.id === file.id }"
        class="media-item"
      >
        <!-- Bild -->
        <div v-if="file.media_type === 'image'" class="media-preview">
          <img :src="getMediaUrl(file.file_path)" :alt="file.original_name" />
        </div>

        <!-- Ljud -->
        <div v-else-if="file.media_type === 'audio'" class="media-preview audio">
          <div class="icon">🎵</div>
          <audio :src="getMediaUrl(file.file_path)" controls></audio>
        </div>

        <!-- Video -->
        <div v-else-if="file.media_type === 'video'" class="media-preview video">
          <video :src="getMediaUrl(file.file_path)" controls></video>
        </div>

        <div class="media-info">
          <div class="filename">{{ file.original_name }}</div>
          <div class="file-details">
            {{ formatFileSize(file.file_size) }} • {{ formatDate(file.created_at) }}
          </div>
        </div>

        <button 
          @click.stop="deleteFile(file)"
          class="delete-btn"
          title="Ta bort fil"
        >
          ×
        </button>
      </div>
    </div>

    <!-- Åtgärdsknappar -->
    <div class="actions">
      <button @click="$emit('close')" class="btn-secondary">
        Avbryt
      </button>
      <button 
        @click="confirmSelection"
        :disabled="!selectedFile"
        class="btn-primary"
      >
        Använd vald fil
      </button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'MediaLibrary',
  props: {
    initialType: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      files: [],
      selectedFile: null,
      selectedType: this.initialType || null,
      loading: false,
      mediaTypes: [
        { value: null, label: 'Alla' },
        { value: 'image', label: 'Bilder' },
        { value: 'audio', label: 'Ljud' },
        { value: 'video', label: 'Video' }
      ]
    };
  },
  computed: {
    filteredFiles() {
      if (!this.selectedType) return this.files;
      return this.files.filter(f => f.media_type === this.selectedType);
    }
  },
  mounted() {
    this.loadFiles();
  },
  methods: {
    async loadFiles() {
      this.loading = true;
      try {
        const response = await axios.get('http://localhost:3001/api/media');
        this.files = response.data;
      } catch (error) {
        console.error('Fel vid laddning av mediafiler:', error);
        alert('Kunde inte ladda mediafiler');
      } finally {
        this.loading = false;
      }
    },
    
    selectFile(file) {
      this.selectedFile = file;
    },
    
    confirmSelection() {
      if (this.selectedFile) {
        this.$emit('select', this.selectedFile);
      }
    },
    
    async deleteFile(file) {
      if (!confirm(`Är du säker på att du vill ta bort "${file.original_name}"?`)) {
        return;
      }
      
      try {
        await axios.delete(`http://localhost:3001/api/media/${file.id}`);
        this.files = this.files.filter(f => f.id !== file.id);
        if (this.selectedFile?.id === file.id) {
          this.selectedFile = null;
        }
      } catch (error) {
        console.error('Fel vid borttagning:', error);
        alert('Kunde inte ta bort filen');
      }
    },
    
    getMediaUrl(path) {
      return `http://localhost:3001${path}`;
    },
    
    formatFileSize(bytes) {
      if (!bytes) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },
    
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('sv-SE', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  }
};
</script>

<style scoped>
.media-library {
  display: flex;
  flex-direction: column;
  height: 600px;
  max-height: 80vh;
}

.media-filters {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e0e0e0;
}

.filter-btn {
  padding: 8px 16px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
}

.filter-btn:hover {
  border-color: #4CAF50;
}

.filter-btn.active {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.loading, .no-files {
  text-align: center;
  padding: 40px;
  color: #666;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  overflow-y: auto;
  flex: 1;
  padding: 10px;
}

.media-item {
  position: relative;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
}

.media-item:hover {
  border-color: #4CAF50;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.media-item.selected {
  border-color: #4CAF50;
  background: #f1f8f4;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
}

.media-preview {
  width: 100%;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 10px;
  overflow: hidden;
}

.media-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.media-preview.audio {
  flex-direction: column;
  padding: 10px;
}

.media-preview .icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.media-preview audio {
  width: 100%;
  margin-top: 10px;
}

.media-preview.video video {
  max-width: 100%;
  max-height: 100%;
}

.media-info {
  font-size: 13px;
}

.filename {
  font-weight: 600;
  margin-bottom: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-details {
  color: #666;
  font-size: 11px;
}

.delete-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(244, 67, 54, 0.9);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.media-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: #f44336;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 2px solid #e0e0e0;
}

.btn-primary, .btn-secondary {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-primary {
  background: #4CAF50;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #45a049;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}
</style>
