import { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import './droppedelement.css';

const DroppedElement = ({ element, setDroppedElements }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const editorRefs = useRef<{ [key: string]: HTMLDivElement }>({});   
    const [specialKeyPressed, setSpecialKeyPressed] = useState(false);

    const initializeEditorJS = useCallback((elementId: string, width: number, height: number) : EditorJS | null => {
        // Direct access to the DOM element
        const editorContainer = editorRefs.current[elementId];

        if (!editorContainer) {
            console.error('Editor container not found for element:', elementId);
            return null;
        }

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
                placeholder: 'Type your content here...',
                onChange: (event) => {
                    console.log('An event : ', event);
                    // const blockCount = editor.blocks.getBlocksCount();
                    // if (blockCount > 1) {
                    //     editor.blocks.delete(blockCount - 1); // Deletes the last block
                    // }
                    const blockCount = editor.blocks.getBlocksCount();
                    const plusButton: HTMLElement | null = document.querySelector('.ce-toolbar__plus'); // Select the plus icon

                    if (blockCount > 1) {
                        editor.blocks.delete(blockCount - 1);
                    }

                    if (blockCount >= 1 && plusButton) {
                        plusButton.style.display = 'none'; // Hide the plus icon
                    } else if (blockCount === 0 && plusButton) {
                        plusButton.style.display = 'block'; // Show it again if no blocks
                    }
                },
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
            editorInstance = initializeEditorJS(element.id, element.width, element.height);
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

    const handleKeyDown = (event: Event) => {
        console.log(event);
    }

    return (
        <motion.div
            ref={editorRef}
            className="dropped-element"
            data-id={element.id}
            data-x={element.x}
            data-y={element.y}
            onKeyDown={e => handleKeyDown(e)}
            style={{
                width: `${element.width}px`,
                height: `${element.height}px`,
                position: 'relative',
                transform: `translate(${element.x}px, ${element.y}px)`,
                backgroundColor: '#fdfdfd',
                border: '1px solid rgba(141, 166, 221, 0.8)',
                borderRadius: '0px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                userSelect: 'none',
                // overflow: 'auto',
                zIndex: `${element.zIndex}`
            }}
        >
        </motion.div>
    );
}

export default DroppedElement;