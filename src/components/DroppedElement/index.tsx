import { useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';

const DroppedElement = ({ element, setDroppedElements }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const editorRefs = useRef<{ [key: string]: HTMLDivElement }>({});
    
    const initializeEditorJS = useCallback((elementId: string) => {
        // Direct access to the DOM element
        const editorContainer = editorRefs.current[elementId];

        if (!editorContainer) {
            console.error('Editor container not found for element:', elementId);
            return null;
        }

        console.log('Editor container : ', editorContainer);

        try {
            const editor = new EditorJS({
                holder: editorContainer,
                tools: {
                    header: {
                        class: Header,
                        inlineToolbar: ['link']
                    },
                    // list: {
                    //     // class: List,
                    //     inlineToolbar: true
                    // }
                },
                data: {
                    blocks: []
                },
                placeholder: 'Type your content here...'
            });

            setDroppedElements(prev => {
                // Create a new array with updated element
                return prev.map(el => 
                  el.id === elementId 
                    ? { ...el, editorInstance: editor }
                    : el
                );
              });

            return editor;
        } catch (error) {
            console.error('Error initializing EditorJS:', error);
            return null;
        }
    }, []);

    useEffect(() => {
        let editorInstance: EditorJS | null = null;

        if (editorRef.current) {
            // Store the actual DOM element
            editorRefs.current[element.id] = editorRef.current;

            // Initialize EditorJS only once
            editorInstance = initializeEditorJS(element.id);

            if (editorInstance) {
                initializeEditorJS(element.id);
            }
        }

        // Cleanup function
        return () => {
            if (editorInstance && typeof editorInstance.destroy === 'function') {
                editorInstance.destroy();
            }
            // Optional: remove the ref from editorRefs
            delete editorRefs.current[element.id];
        };
    }, [element.id]);

    return (
        <motion.div
            ref={editorRef}
            className="dropped-element"
            data-id={element.id}
            data-x={element.x}
            data-y={element.y}
            style={{
                width: `${element.width}px`,
                height: `${element.height}px`,
                position: 'absolute',
                transform: `translate(${element.x}px, ${element.y}px)`,
                backgroundColor: '#fdfdfd',
                border: '1px solid rgba(141, 166, 221, 0.8)',
                borderRadius: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                userSelect: 'none',
                zIndex: `${element.zIndex}`
            }}
        >
            Content Block
        </motion.div>
    );
}

export default DroppedElement;