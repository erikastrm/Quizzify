<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ title }}</h3>
      </div>

      <div class="modal-body">
        <p>{{ message }}</p>
      </div>

      <div class="modal-actions">
        <button class="button secondary" @click="$emit('cancel')">
          {{ cancelText }}
        </button>
        <button class="button danger" @click="$emit('confirm')">
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ConfirmDialog',
  props: {
    title: {
      type: String,
      default: 'Bekräfta'
    },
    message: {
      type: String,
      required: true
    },
    confirmText: {
      type: String,
      default: 'Bekräfta'
    },
    cancelText: {
      type: String,
      default: 'Avbryt'
    }
  },
  emits: ['confirm', 'cancel'],
  setup(props, { emit }) {
    function closeModal() {
      emit('cancel')
    }

    return {
      closeModal
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 1.5rem 1.5rem 1rem 1.5rem;
}

.modal-header h3 {
  color: #374151;
  font-size: 1.2rem;
  margin: 0;
}

.modal-body {
  padding: 0 1.5rem 1.5rem 1.5rem;
  color: #6b7280;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  padding: 1rem 1.5rem 1.5rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.modal-actions .button {
  flex: 1;
}

@media (max-width: 768px) {
  .modal-actions {
    flex-direction: column;
  }
}
</style>