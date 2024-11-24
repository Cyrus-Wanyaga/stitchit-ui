import { useState, useEffect, useCallback } from 'react';
import interact from 'interactjs';
import { motion, useMotionValue } from 'framer-motion';
import './createfile.css';

const CreateFile = () => {
    const [dragging, setDragging] = useState(false);
    const [droppedElements, setDroppedElements] : any = useState([]);
    const [ghostPosition, setGhostPosition] : any = useState(null);
    const [isDraggingNew, setIsDraggingNew] = useState(false);
    const rotate = useMotionValue(0);

    // Constants for A4 page dimensions (in pixels, assuming 96 DPI)
    const PAGE_WIDTH = 210 * 3.7795275591; // Convert mm to pixels
    const PAGE_HEIGHT = 297 * 3.7795275591;
    const GRID_SIZE = 10;

    const snapToGrid = (value: number) : number => Math.round(value / GRID_SIZE) * GRID_SIZE;

    const checkBoundaries = (x: number, y: number, width: number, height: number) => {
        return {
            x: Math.max(0, Math.min(x, PAGE_WIDTH - width)),
            y: Math.max(0, Math.min(y, PAGE_HEIGHT - height))
        };
    };

    const initializeDraggable = useCallback(() => {
        // Initialize new element dragging
        interact('.draggable')
            .draggable({
                inertia: true,
                autoStart: true,
                onstart: (event) => {
                    // console.log(event.dy);
                    const rect = event.target.getBoundingClientRect();
                    setDragging(true);
                    setIsDraggingNew(true);
                    setGhostPosition({
                        x: event.pageX - rect.width / 2,
                        y: event.pageY - rect.height / 2,
                        width: rect.width,
                        height: rect.height
                    });
                    rotate.set(5);
                },
                onmove: (event) => {
                    if (isDraggingNew) {
                        setGhostPosition(prev => ({
                            ...prev,
                            x: event.pageX - prev.width / 2,
                            y: event.pageY - prev.height / 2
                        }));
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
                        const relativeX = event.pageX - dropZoneRect.left;
                        const relativeY = event.pageY - dropZoneRect.top;
                        
                        const { x: boundedX, y: boundedY } = checkBoundaries(
                            snapToGrid(relativeX),
                            snapToGrid(relativeY),
                            396,
                            100
                        );

                        setDroppedElements(prev => [
                            ...prev,
                            {
                                id: Date.now(),
                                x: boundedX,
                                y: boundedY,
                                width: 396,
                                height: 100
                            }
                        ]);
                    }

                    setDragging(false);
                    setIsDraggingNew(false);
                    setGhostPosition(null);
                    rotate.set(0);
                }
            });

        // Initialize dropped elements dragging
    }, [isDraggingNew, rotate, PAGE_WIDTH, PAGE_HEIGHT]);

    const initializeContentDraggable = useCallback(() => {
        interact('.dropped-element')
            .draggable({
                inertia: true,
                autoStart: true,
                modifiers: [
                    interact.modifiers.snap({
                        targets: [
                            interact.snappers.grid({
                                x: GRID_SIZE,
                                y: GRID_SIZE,
                                range: GRID_SIZE / 2
                            })
                        ]
                    }),
                    interact.modifiers.restrict({
                        restriction: 'parent',
                        elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
                    })
                ],
                onstart: (event) => {
                    const elementId = event.target.getAttribute('data-id');
                    // Hide other elements while dragging this one
                    console.log(droppedElements);
                    setDroppedElements(prev =>
                        prev.map(el => ({
                            ...el,
                            visible: el.id.toString() === elementId
                        }))
                    );
                },
                onmove: (event) => {
                    const target = event.target;
                    const elementId = target.getAttribute('data-id');
                    const dx = snapToGrid(event.dx);
                    const dy = snapToGrid(event.dy);

                    setDroppedElements(prev =>
                        prev.map(el => {
                            if (el.id.toString() === elementId) {
                                const newX = el.x + dx;
                                const newY = el.y + dy;
                                const { x: boundedX, y: boundedY } = checkBoundaries(
                                    newX,
                                    newY,
                                    el.width,
                                    el.height
                                );
                                return { ...el, x: boundedX, y: boundedY };
                            }
                            return el;
                        })
                    );
                },
                onend: () => {
                    // Show all elements again
                    setDroppedElements(prev =>
                        prev.map(el => ({ ...el, visible: true }))
                    );
                }
            });
    }, [droppedElements])

    useEffect(() => {
        initializeDraggable();
        initializeContentDraggable();
    }, [initializeDraggable, initializeContentDraggable]);

    const DroppedElement = ({ element }) => (
        <motion.div
            className="dropped-element"
            data-id={element.id}
            // initial={{ opacity: 0 }}
            animate={{ 
                opacity: element.visible === false ? 0 : 1,
                x: element.x,
                y: element.y
            }}
            style={{
                width: `${element.width}px`,
                height: `${element.height}px`,
                backgroundColor: '#fdfdfd',
                boxShadow: '1px 1px 100px rgba(0, 0, 0, 0.1)',
                borderRadius: '5px',
                position: 'fixed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: '24px'
            }}
        >
            Content Block
        </motion.div>
    );

    return (
        <div className="create-file-container">
            <div className="left-pane">
                <h4>Start by grabbing a div below</h4>
                <p style={{marginTop: '48px'}}>And drop it into the creator area on your right</p>
                <motion.div
                    className="draggable"
                    whileHover={{ scale: 1.01 }}
                    style={{
                        width: '100%',
                        height: '100px',
                        marginTop: '48px',
                        backgroundColor: 'limegreen',
                        borderRadius: '5px',
                        cursor: 'grab !important',
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
                <div className="page-area">
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
                        backgroundColor: 'limegreen',
                        borderRadius: '5px',
                        pointerEvents: 'none',
                        cursor: '-webkit-grab',
                        zIndex: 1000,
                        opacity: 0.8,
                        rotate,
                        boxShadow: '2px 2px 10px rgba(0, 0, 0, 0.3)',
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