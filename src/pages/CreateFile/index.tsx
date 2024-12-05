import { motion, useMotionValue } from 'framer-motion';
import interact from 'interactjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import DroppedElement from '../../components/DroppedElement';
import './createfile.css';

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
    const [marginVisible, setIsMarginVisible] = useState(false);
    const rotate = useMotionValue(0);
    const isProcessingDrop = useRef(false);
    const pageAreaRef = useRef<HTMLDivElement>(null);

    // Constants for A4 page dimensions (in pixels, assuming 96 DPI)
    const PAGE_WIDTH = 210 * 3.7795275591; // Convert mm to pixels
    const PAGE_HEIGHT = 297 * 3.7795275591;
    const GRID_SIZE = 10;
    const PAGE_MARGIN_LEFT = 76;
    const PAGE_MARGIN_RIGHT = 76;
    const PAGE_MARGIN_TOP = 76;

    const snapToGrid = (value: number): number => Math.round(value / GRID_SIZE) * GRID_SIZE;

    const checkBoundaries = (x: number, y: number, width: number, height: number) => {
        return {
            x: Math.max(PAGE_MARGIN_LEFT, Math.min(x, PAGE_WIDTH - width - PAGE_MARGIN_RIGHT)),
            y: Math.max(PAGE_MARGIN_TOP, Math.min(y, PAGE_HEIGHT - height))
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
                            setIsMarginVisible(true);
                            rotate.set(0);
                        } else {
                            rotate.set(10);
                            setIsMarginVisible(false);
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
    }, [isDraggingNew]);

    const pageAreaDimensions = (): { width: number, height: number } => {
        const pageArea = pageAreaRef.current;
        if (!pageArea) {
            return {
                width: 0,
                height: 0
            }
        }

        return {
            width: pageArea.offsetWidth,
            height: pageArea.offsetHeight
        }
    };

    const initializeContentDraggable = useCallback(() => {
        // const { width: pageWidth, height: pageHeight } = pageAreaDimensions();
        interact('.dropped-element')
            .draggable({
                inertia: true,
                modifiers: [
                    // Snap to grid
                    interact.modifiers.snapSize({
                        targets: [
                            interact.snappers.grid({
                                x: 10,
                                y: 10
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
                                    target.style.transform = `translate(${x}px, ${y}px)`;
                                    target.setAttribute('data-x', x.toString());
                                    target.setAttribute('data-y', y.toString());

                                    return {
                                        ...el,
                                        x: x,
                                        y: y,
                                        zIndex: '100'
                                    };
                                }
                                return el;
                            })
                        );
                        // const id = event.target.getAttribute('data-id');
                        // const dragElement = event.target;
                        // console.log('Drag element id : ', dragElement);
                        // if (dragElement) {
                        //     console.log(`Drag element is available`);
                        //     const rect = dragElement.getBoundingClientRect();
                        //     dragElement.style.position = 'absolute';
                        //     dragElement.style.left = `${event.clientX - rect.width / 2}px`;
                        //     dragElement.style.top = `${event.clientY - rect.height / 2}px`;
                        //     dragElement.style.zIndex = '1000';
                        // }
                    },
                    end(event) {
                        setDroppedElements(prev =>
                            prev.map(el => ({ ...el, zIndex: '1' }))
                        );
                    }
                },
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
                },
                modifiers: [
                    interact.modifiers.restrictEdges({
                        outer: () => {
                            const pageRect = pageAreaRef.current?.getBoundingClientRect();

                            const left = pageRect?.left;
                            const right = pageRect?.right;
                            const top = pageRect?.top;
                            console.log(pageRect);
                            const bottom = pageRect?.bottom;

                            return {
                                left: left + 76,
                                right: right - 76,
                                top: top + 76
                            };
                        },
                    }),
                ],
            });
    }, []);

    useEffect(() => {
        initializeDraggable();
    }, [isDraggingNew]);

    useEffect(() => {
        initializeContentDraggable();
    }, [droppedElements]);

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
                <div ref={pageAreaRef} className="page-area">
                    {marginVisible && (
                        <>
                            <div className='top-margin-border'></div>
                            <div className='left-margin-border'></div>
                            <div className='right-margin-border'></div>
                            <div className='bottom-margin-border'></div>
                        </>
                    )}
                    {droppedElements.map(element => (
                        <DroppedElement key={element.id} element={element} setDroppedElements={setDroppedElements} />
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