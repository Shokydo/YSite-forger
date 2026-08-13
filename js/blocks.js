/* ===== SiteForge Blocks - Библиотека блоков ===== */

const BlocksLibrary = {
  /**
   * Создать блок по типу
   */
  create(type, customProps = {}) {
    const base = {
      id: 'block_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      type: type,
      styles: {},
      ...customProps
    };

    switch (type) {
      case 'section':
        return {
          ...base,
          styles: {
            padding: '40px 20px',
            background: '#111111',
            ...base.styles
          },
          children: base.children || []
        };

      case 'container':
        return {
          ...base,
          styles: {
            maxWidth: '1100px',
            margin: '0 auto',
            ...base.styles
          },
          children: base.children || []
        };

      case 'columns':
        return {
          ...base,
          styles: {
            display: 'flex',
            gap: '20px',
            ...base.styles
          },
          children: [
            {
              type: 'column',
              id: base.id + '-col1',
              styles: { flex: '1', padding: '16px', background: '#1a1a1a', borderRadius: '8px' },
              children: [
                {
                  type: 'heading',
                  id: base.id + '-h1',
                  content: 'Колонка 1',
                  styles: { fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }
                },
                {
                  type: 'paragraph',
                  id: base.id + '-p1',
                  content: 'Текст первой колонки',
                  styles: { fontSize: '14px', lineHeight: '1.6', margin: '0', color: '#bbbbbb' }
                }
              ]
            },
            {
              type: 'column',
              id: base.id + '-col2',
              styles: { flex: '1', padding: '16px', background: '#1a1a1a', borderRadius: '8px' },
              children: [
                {
                  type: 'heading',
                  id: base.id + '-h2',
                  content: 'Колонка 2',
                  styles: { fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }
                },
                {
                  type: 'paragraph',
                  id: base.id + '-p2',
                  content: 'Текст второй колонки',
                  styles: { fontSize: '14px', lineHeight: '1.6', margin: '0', color: '#bbbbbb' }
                }
              ]
            }
          ]
        };

      case 'divider':
        return {
          ...base,
          styles: {
            border: 'none',
            height: '1px',
            background: '#2a2a2a',
            margin: '24px 0',
            ...base.styles
          }
        };

      case 'heading':
        return {
          ...base,
          content: base.content || 'Заголовок',
          level: base.level || 'h2',
          styles: {
            fontSize: '32px',
            fontWeight: '700',
            lineHeight: '1.3',
            color: '#f5f5f5',
            margin: '0 0 16px 0',
            ...base.styles
          }
        };

      case 'paragraph':
        return {
          ...base,
          content: base.content || 'Это текст параграфа. Нажмите чтобы редактировать.',
          styles: {
            fontSize: '16px',
            lineHeight: '1.6',
            color: '#bbbbbb',
            margin: '0 0 12px 0',
            ...base.styles
          }
        };

      case 'list':
        return {
          ...base,
          listType: base.listType || 'unordered', // unordered | ordered
          items: base.items || ['Элемент списка 1', 'Элемент списка 2', 'Элемент списка 3'],
          styles: {
            fontSize: '16px',
            lineHeight: '1.6',
            color: '#bbbbbb',
            margin: '0 0 12px 24px',
            ...base.styles
          }
        };

      case 'button':
        return {
          ...base,
          content: base.content || 'Нажми меня',
          href: base.href || '#',
          styles: {
            padding: '12px 28px',
            background: '#ffffff',
            color: '#0d0d0d',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'inline-block',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            ...base.styles
          }
        };

      case 'image':
        return {
          ...base,
          src: base.src || 'https://placehold.co/800x400/2a2a2a/bbbbbb?text=Изображение',
          alt: base.alt || 'Изображение',
          objectFit: base.objectFit || 'cover',
          styles: {
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '8px',
            display: 'block',
            ...base.styles
          }
        };

      case 'gallery':
        return {
          ...base,
          columns: base.columns || 3,
          images: base.images || [
            'https://placehold.co/400x300/2a2a2a/bbbbbb?text=Фото+1',
            'https://placehold.co/400x300/2a2a2a/bbbbbb?text=Фото+2',
            'https://placehold.co/400x300/2a2a2a/bbbbbb?text=Фото+3'
          ],
          styles: {
            ...base.styles
          }
        };

      case 'form':
        return {
          ...base,
          formAction: base.formAction || 'message', // message | download | mailto
          styles: {
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxWidth: '500px',
            margin: '0 auto',
            ...base.styles
          },
          children: base.children || [
            {
              type: 'input',
              id: base.id + '-name',
              label: 'Имя',
              placeholder: 'Ваше имя',
              fieldType: 'text'
            },
            {
              type: 'input',
              id: base.id + '-email',
              label: 'Email',
              placeholder: 'your@email.com',
              fieldType: 'email'
            },
            {
              type: 'textarea',
              id: base.id + '-message',
              label: 'Сообщение',
              placeholder: 'Ваше сообщение...'
            },
            {
              type: 'button',
              id: base.id + '-submit',
              content: 'Отправить',
              styles: {
                padding: '12px 28px',
                background: '#ffffff',
                color: '#0d0d0d',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }
            }
          ]
        };

      case 'input':
        return {
          ...base,
          label: base.label || 'Поле ввода',
          placeholder: base.placeholder || '',
          fieldType: base.fieldType || 'text',
          required: base.required || false,
          styles: {
            ...base.styles
          }
        };

      case 'textarea':
        return {
          ...base,
          label: base.label || 'Текстовое поле',
          placeholder: base.placeholder || '',
          required: base.required || false,
          styles: {
            ...base.styles
          }
        };

      case 'column':
        return {
          ...base,
          styles: {
            flex: '1',
            padding: '16px',
            ...base.styles
          },
          children: base.children || []
        };

      case 'nav-link':
        return {
          ...base,
          content: base.content || 'Ссылка',
          href: base.href || '#',
          styles: {
            color: '#cccccc',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '500',
            ...base.styles
          }
        };

      case 'nav':
        return {
          ...base,
          styles: {
            display: 'flex',
            gap: '24px',
            alignItems: 'center',
            ...base.styles
          },
          children: base.children || []
        };

      default:
        return base;
    }
  }
};

