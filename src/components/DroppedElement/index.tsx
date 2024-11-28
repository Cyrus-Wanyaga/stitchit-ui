import { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import './droppedelement.css';

const DroppedElement = ({ element, setDroppedElements }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const editorRefs = useRef<{ [key: string]: HTMLDivElement }>({});   
    const [specialKeyPressed, setSpecialKeyPressed] = useState(false);
    const initializeEditorJS = useCallback(async (elementId: string, width: number, height: number) => {
        // Direct access to the DOM element
        const editorContainer = editorRefs.current[elementId];

        if (!editorContainer) {
            console.error('Editor container not found for element:', elementId);
            return null;
        }

        console.log('Editor container : ', editorContainer);
        console.log('Width: ', width, ' : ', height);

        const inlineStyles = `
            .editorjs-container {
                border: 2px dashed #ccc;
                padding: 10px;
                border-radius: 5px;
                background-color: #f9f9f9;
            }

            .codex-editor: {
                background-color: 'red',
            }
        `;

        // const styleElement = document.createElement('style');
        // styleElement.setAttribute('nonce', element.id); // Use the same nonce as Editor.js
        // styleElement.textContent = inlineStyles;
        // document.head.appendChild(styleElement);

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

            console.log('editor : ', editor);

            // editor.on('change', () => {
            //     console.log('change occurred');
            //     const blockCount = editor.blocks.getBlocksCount();
            //     if (blockCount > 1) {
            //         editor.blocks.delete(blockCount - 1); // Deletes the last block
            //     }
            // });

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

    const styleTag = useMemo(() => {
        const style = document.createElement('style');
        style.setAttribute('nonce', element.id);
        style.textContent = `
            /* Scoped styles for this specific EditorJS instance */
            #${element.id} .codex-editor {
                max-width: 100% !important;
                max-height: 100% !important;
                overflow: hidden !important;
            }
            
            #${element.id} .codex-editor__content {
                max-width: 100% !important;
                max-height: 100% !important;
                overflow: hidden !important;
            }
        `;
        return style;
    }, [element.id]);

    useEffect(() => {
        // Append the style tag when the component mounts
        document.head.appendChild(styleTag);

        // Cleanup the style tag when the component unmounts
        return () => {
            document.head.removeChild(styleTag);
        };
    }, []);

    const handleKeyDown = (event) => {
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