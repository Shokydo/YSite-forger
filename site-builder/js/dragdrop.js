/* ===== SiteForge Drag & Drop ===== */

const DragDrop = {
  _draggedElement: null,
  _draggedBlockId: null,
  _dragSource: null, // 'library' | 'canvas'
  _dropIndicator: null,

  /**
   * Инициализация Drag & Drop
   */
  init() {
    this._createDropIndicator();
    this._initLibraryDrag();
    this._initCanvasDrag();
    this._initGlobalDropZone();
  },

  /**
   * Создаёт визуальный индикатор места вставки
   */
  _createDropIndicator() {
    this._dropIndicator = document.createElement('div');
    this._dropIndicator.className = 'drop-indicator';
    this._dropIndicator.style.cssText = `
      height: 3px;
      background: #ffffff;
      border-radius: 2px;
      margin: 4px 0;
      display: none;
      transition: opacity 0.15s ease;
      pointer-events: none;
    `;
    document.getElementById('canvasPage')?.appendChild(this._dropIndicator);
  },

  /**
   * Инициализация drag из библиотеки блоков
   */
  _initLibraryDrag() {
    const items = document.querySelectorAll('.block-item[draggable="true"]');
    items.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        this._dragSource = 'library';
        this._draggedElement = item;
        e.dataTransfer.setData('text/plain', item.dataset.block);
        e.dataTransfer.effectAllowed = 'copy';
        item.style.opacity = '0.5';
        
        // Создаём кастомный образ
        const ghost = item.cloneNode(true);
        ghost.style.cssText = `
          position: absolute;
          top: -1000px;
          padding: 8px 16px;
          background: #ffffff;
          color: #0d0d0d;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
        `;
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 60, 20);
        setTimeout(() => ghost.remove(), 0);
      });

      item.addEventListener('dragend', () => {
        item.style.opacity = '1';
        this._dragSource = null;
        this._draggedElement = null;
        this._hideDropIndicator();
      });
    });
  },

  /**
   * Инициализация drag на канвасе (для перемещения блоков)
   */
  _initCanvasDrag() {
    const canvasPage = document.getElementById('canvasPage');
    if (!canvasPage) return;

    // Используем делегирование событий
    canvasPage.addEventListener('dragstart', (e) => {
      const wrapper = e.target.closest('.block-wrapper');
      if (!wrapper) return;
      
      this._dragSource = 'canvas';
      this._draggedBlockId = wrapper.dataset.blockId;
      e.dataTransfer.setData('text/plain', wrapper.dataset.blockId);
      e.dataTransfer.effectAllowed = 'move';
      wrapper.style.opacity = '0.5';
    });

    canvasPage.addEventListener('dragend', (e) => {
      const wrapper = e.target.closest('.block-wrapper');
      if (wrapper) wrapper.style.opacity = '1';
      
      // Убираем подсветку со всех блоков
      document.querySelectorAll('.block-wrapper.drag-over-top, .block-wrapper.drag-over-bottom')
        .forEach(el => {
          el.classList.remove('drag-over-top', 'drag-over-bottom');
        });
      
      this._hideDropIndicator();
      this._dragSource = null;
      this._draggedBlockId = null;
    });
  },

  /**
   * Инициализация глобальной зоны сброса
   */
  _initGlobalDropZone() {
    const canvasPage = document.getElementById('canvasPage');
    const canvasArea = document.querySelector('.canvas-area');
    
    if (!canvasPage) return;

    // Обрабатываем dragover на всё поле канваса
    canvasPage.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = this._dragSource === 'library' ? 'copy' : 'move';
      
      const target = e.target.closest('.block-wrapper, .canvas-drop-zone');
      if (target) {
        const rect = target.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const midY = rect.height / 2;
        
        // Убираем предыдущую подсветку
        document.querySelectorAll('.block-wrapper.drag-over-top, .block-wrapper.drag-over-bottom')
          .forEach(el => el.classList.remove('drag-over-top', 'drag-over-bottom'));
        
        if (y < midY) {
          target.classList.add('drag-over-top');
        } else {
          target.classList.add('drag-over-bottom');
        }
      }
    });

    canvasPage.addEventListener('dragleave', (e) => {
      const target = e.target.closest('.block-wrapper');
      if (target) {
        target.classList.remove('drag-over-top', 'drag-over-bottom');
      }
    });

    canvasPage.addEventListener('drop', (e) => {
      e.preventDefault();
      
      // Убираем подсветку
      document.querySelectorAll('.block-wrapper.drag-over-top, .block-wrapper.drag-over-bottom')
        .forEach(el => el.classList.remove('drag-over-top', 'drag-over-bottom'));
      
      const blockType = e.dataTransfer.getData('text/plain');
      if (!blockType) return;

      if (this._dragSource === 'library') {
        // Создаём новый блок из библиотеки
        const newBlock = BlocksLibrary.create(blockType);
        
        // Определяем место вставки
        const targetWrapper = e.target.closest('.block-wrapper');
        if (targetWrapper) {
          const rect = targetWrapper.getBoundingClientRect();
          const y = e.clientY - rect.top;
          const midY = rect.height / 2;
          const parentId = targetWrapper.parentElement?.closest('.block-wrapper')?.dataset.blockId || null;
          const currentIndex = parseInt(targetWrapper.dataset.index);
          const insertIndex = y < midY ? currentIndex : currentIndex + 1;
          
          Store.addBlock(newBlock, parentId, insertIndex);
        } else {
          // Добавляем в конец
          Store.addBlock(newBlock);
        }
        
        this._hideDropIndicator();
      } else if (this._dragSource === 'canvas' && this._draggedBlockId) {
        // Перемещаем существующий блок
        const targetWrapper = e.target.closest('.block-wrapper');
        if (targetWrapper && targetWrapper.dataset.blockId !== this._draggedBlockId) {
          const rect = targetWrapper.getBoundingClientRect();
          const y = e.clientY - rect.top;
          const midY = rect.height / 2;
          const parentId = targetWrapper.parentElement?.closest('.block-wrapper')?.dataset.blockId || null;
          const currentIndex = parseInt(targetWrapper.dataset.index);
          const insertIndex = y < midY ? currentIndex : currentIndex + 1;
          
          Store.moveBlock(this._draggedBlockId, parentId, insertIndex);
        }
      }

      this._dragSource = null;
      this._draggedBlockId = null;
    });
  },

  _showDropIndicator(beforeElement) {
    if (this._dropIndicator && beforeElement) {
      this._dropIndicator.style.display = 'block';
      beforeElement.parentNode?.insertBefore(this._dropIndicator, beforeElement);
    }
  },

  _hideDropIndicator() {
    if (this._dropIndicator) {
      this._dropIndicator.style.display = 'none';
    }
  }
};

