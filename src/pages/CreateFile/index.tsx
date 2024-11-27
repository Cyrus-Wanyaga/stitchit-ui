import React, { useState, useEffect, useCallback, useRef } from 'react';
import interact from 'interactjs';
import { motion, useMotionValue } from 'framer-motion';
import './createfile.css';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';

interface DroppedElement {
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    visible: boolean,
    zIndex?: string
};

interface GhostPosition {
    x: number,
    y: number,
    width?: number,
    height?: number
};

const CreateFile = () => {
    const [dragging, setDragging] = useState(false);
    const [droppedElements, setDroppedElements] = useState<DroppedElement[]>([]);
    const [ghostPosition, setGhostPosition] = useState<GhostPosition | null>(null);
    const [isDraggingNew, setIsDraggingNew] = useState(false);
    const rotate = useMotionValue(0);
    const isProcessingDrop = useRef(false);
    const pageAreaRef = useRef<HTMLDivElement>(null);
    const editorRefs = useRef<{[key: string]: HTMLDivElement}>({});
    // Constants for A4 page dimensions (in pixels, assuming 96 DPI)
    const PAGE_WIDTH = 210 * 3.7795275591; // Convert mm to pixels
    const PAGE_HEIGHT = 297 * 3.7795275591;
    const GRID_SIZE = 10;

    const snapToGrid = (value: number): number => Math.round(value / GRID_SIZE) * GRID_SIZE;

    const checkBoundaries = (x: number, y: number, width: number, height: number) => {
        return {
            x: Math.max(0, Math.min(x, PAGE_WIDTH - width)),
            y: Math.max(0, Math.min(y, PAGE_HEIGHT - height))
        };
    };

    const handleElementDrop = useCallback((event: MouseEvent, dropZoneRect: DOMRect, width: number, height: number) => {
        if (isProcessingDrop.current) return;
        isProcessingDrop.current = true;

        const relativeX = event.pageX - dropZoneRect.left;
        const relativeY = event.pageY - dropZoneRect.top;

        const { x: boundedX, y: boundedY } = checkBoundaries(
            snapToGrid(relativeX),
            snapToGrid(relativeY),
            width,
            height
        );

        const elementId = `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        editorRefs.current[elementId] = React.createRef<HTMLDivElement>();
        console.log('On drop ', editorRefs);

        setDroppedElements(prev => [
            ...prev,
            {
                id: elementId,
                x: boundedX,
                y: boundedY,
                width: width,
                height: height,
                visible: true,
                zIndex: '1'
            }
        ]);

        // Reset the processing flag after a short delay
        setTimeout(() => {
            isProcessingDrop.current = false;
        }, 100);
    }, []);

    const initializeEditorJS = useCallback((elementId: string) => {
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
                    list: {
                        // class: List,
                        inlineToolbar: true
                    }
                },
                data: {
                    blocks: []
                },
                placeholder: 'Type your content here...'
            });

            // Update the element with editor instance
            setDroppedElements(prev =>
                prev.map(el =>
                    el.id === elementId
                        ? { ...el, editorInstance: editor }
                        : el
                )
            );

            return editor;
        } catch (error) {
            console.error('Error initializing EditorJS:', error);
            return null;
        }
    }, []);

    const initializeDraggable = useCallback(() => {
        // Initialize new element dragging
        interact('.draggable')
            .draggable({
                inertia: true,
                autoStart: true,
                onstart: (event) => {
                    const rect = event.target.getBoundingClientRect();
                    setDragging(true);
                    setIsDraggingNew(true);
                    setGhostPosition({
                        x: event.pageX - rect.width / 2,
                        y: event.pageY - rect.height / 2,
                        width: rect.width,
                        height: rect.height
                    });
                    rotate.set(10);
                },
                onmove: (event) => {
                    if (isDraggingNew) {
                        setGhostPosition(prev => ({
                            ...prev,
                            x: event.pageX - prev.width / 2,
                            y: event.pageY - prev.height / 2
                        }));

                        const dropZone = document.querySelector('.page-area');
                        if (!dropZone) return;

                        const dropZoneRect = dropZone.getBoundingClientRect();
                        const isInDropZone = (
                            event.pageX > dropZoneRect.left &&
                            event.pageX < dropZoneRect.right &&
                            event.pageY > dropZoneRect.top &&
                            event.pageY < dropZoneRect.bottom
                        );

                        if (isInDropZone && isDraggingNew) {
                            rotate.set(0);
                        } else {
                            rotate.set(10);
                        }
                    }
                },
                onend: (event) => {
                    const dropZone = document.querySelector('.page-area');
                    if (!dropZone) return;

                    const dropZoneRect = dropZone.getBoundingClientRect();
                    const isInDropZone = (
                        event.pageX > dropZoneRect.left &&
                        event.pageX < dropZoneRect.right &&
                        event.pageY > dropZoneRect.top &&
                        event.pageY < dropZoneRect.bottom
                    );

                    if (isInDropZone && isDraggingNew) {
                        const width = Math.ceil(event.target.offsetWidth);
                        const height = Math.ceil(event.target.offsetHeight);
                        handleElementDrop(event, dropZoneRect, width, height);
                    }

                    setDragging(false);
                    setIsDraggingNew(false);
                    setGhostPosition(null);
                    rotate.set(0);
                }
            });
    }, [isDraggingNew, rotate, handleElementDrop]);

    const initializeContentDraggable = useCallback(() => {
        interact('.dropped-element')
            .draggable({
                inertia: true,
                modifiers: [
                    // Snap to grid
                    interact.modifiers.snapSize({
                        targets: [
                            interact.snappers.grid({
                                x: GRID_SIZE,
                                y: GRID_SIZE
                            })
                        ]
                    }),
                    // Restrict movement to page area
                    interact.modifiers.restrictRect({
                        restriction: '.page-area',
                        elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
                    })
                ],
                listeners: {
                    start(event) {
                        const target = event.target as HTMLElement;
                        target.style.zIndex = '10';
                    },
                    move(event) {
                        const target = event.target as HTMLElement;
                        const x = (parseFloat(target.getAttribute('data-x') || '0') || 0) + event.dx;
                        const y = (parseFloat(target.getAttribute('data-y') || '0') || 0) + event.dy;
                        // Update element position
                        setDroppedElements(prev =>
                            prev.map(el => {
                                if (el.id === target.getAttribute('data-id')) {
                                    const { x: boundedX, y: boundedY } = checkBoundaries(
                                        snapToGrid(x),
                                        snapToGrid(y),
                                        el.width,
                                        el.height,
                                    );

                                    // Update transform and data attributes
                                    target.style.transform = `translate(${boundedX}px, ${boundedY}px)`;
                                    // target.style.zIndex = '100';
                                    target.setAttribute('data-x', boundedX.toString());
                                    target.setAttribute('data-y', boundedY.toString());

                                    return {
                                        ...el,
                                        x: boundedX,
                                        y: boundedY,
                                        zIndex: '100'
                                    };
                                }
                                return el;
                            })
                        );
                    },
                    end(event) {
                        setDroppedElements(prev =>
                            prev.map(el => ({ ...el, zIndex: '1' }))
                        );
                    }
                }
            }).resizable({
                edges: { top: true, left: true, bottom: true, right: true },
                listeners: {
                    move: function (event) {
                        let { x, y } = event.target.dataset

                        x = (parseFloat(x) || 0) + event.deltaRect.left
                        y = (parseFloat(y) || 0) + event.deltaRect.top

                        Object.assign(event.target.style, {
                            width: `${event.rect.width}px`,
                            height: `${event.rect.height}px`,
                            transform: `translate(${x}px, ${y}px)`
                        })

                        Object.assign(event.target.dataset, { x, y })
                    }
                }
            });
    }, []);

    useEffect(() => {
        initializeDraggable();
        initializeContentDraggable();
    }, [initializeDraggable, initializeContentDraggable, droppedElements]);

    const DroppedElement = ({ element }) => {
        const editorRef = useRef<HTMLDivElement>(null);

        // useEffect(() => {
        //     if (editorRef.current) {
        //         // Store the actual DOM element, not the ref object
        //         editorRefs.current[element.id] = editorRef.current;

        //         // Initialize EditorJS
        //         const editor = initializeEditorJS(element.id);

        //         // Cleanup
        //         return () => {
        //             if (editor && typeof editor.destroy === 'function') {
        //                 editor.destroy();
        //             }
        //         };
        //     }
        // }, [element.id, initializeEditorJS]);

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

    return (
        <div className="create-file-container" style={{ border: '1px solid transparent' }}>
            <div className="left-pane">
                <h4>Grab a content block below</h4>
                <p style={{ marginTop: '48px', textAlign: 'center' }}>And drop it into the creator area on the right</p>
                <motion.div
                    className="draggable"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    whileHover={{ scale: 1.01 }}
                    style={{
                        width: '100%',
                        padding: '48px 0',
                        marginTop: '48px',
                        backgroundColor: '#8da6dd',
                        borderRadius: '5px',
                        cursor: 'grabbing',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        userSelect: 'none'
                    }}
                >
                    Drag Me
                </motion.div>
            </div>

            <div className="drop-zone">
                <div ref={pageAreaRef} className="page-area" style={{ position: 'relative' }}>
                    {droppedElements.map(element => (
                        <DroppedElement key={element.id} element={element} />
                    ))}
                </div>
            </div>

            {ghostPosition && isDraggingNew && (
                <motion.div
                    style={{
                        position: 'absolute',
                        width: `${ghostPosition.width}px`,
                        height: `${ghostPosition.height}px`,
                        left: ghostPosition.x,
                        top: ghostPosition.y,
                        backgroundColor: '#8da6dd',
                        borderRadius: '5px',
                        pointerEvents: 'none',
                        cursor: 'grabbing',
                        zIndex: 100,
                        opacity: 0.8,
                        rotate,
                        boxShadow: '1px 1px 10px rgba(0, 0, 0, 0.3)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontWeight: 'bold'
                    }}
                >
                    Drop Me
                </motion.div>
            )}
        </div>
    );
};

export default CreateFile;