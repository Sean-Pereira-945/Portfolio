import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import UIEventBus from '../EventBus';
import { Easing } from '../Animation';
// @ts-ignore
import camera from '../../../../static/textures/UI/camera.svg';
// @ts-ignore
import mouse from '../../../../static/textures/UI/mouse.svg';

interface FreeCamToggleProps {}

const FreeCamToggle: React.FC<FreeCamToggleProps> = ({}) => {
    const [isHovering, setIsHovering] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [freeCamActive, setFreeCamActive] = useState(false);
    const [blockEvents, setBlockEvents] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setBlockEvents(false);
        }, 100);
    }, []);

    useEffect(() => {
        if (!blockEvents) {
            window.postMessage({ type: 'keydown', key: `_AUTO_` }, '*');
            UIEventBus.dispatch('freeCamToggle', freeCamActive);
        }
    }, [freeCamActive]);

    return (
        <div style={styles.wrapper}>
            <button
                type="button"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => {
                    setIsHovering(false);
                    setIsActive(false);
                }}
                onMouseDown={(event) => {
                    // Keep the scene from treating this press as a camera click.
                    event.preventDefault();
                    setIsActive(true);
                }}
                onMouseUp={() => setIsActive(false)}
                onClick={() => setFreeCamActive(!freeCamActive)}
                style={styles.container}
                className="icon-control-container icon-control-container--padded"
                data-ui-control
                aria-label="Free camera"
                aria-pressed={freeCamActive}
            >
                <motion.img
                    src={freeCamActive ? mouse : camera}
                    alt=""
                    className={
                        freeCamActive
                            ? 'icon-control-image icon-mouse'
                            : 'icon-control-image icon-camera'
                    }
                    style={{ opacity: isActive ? 0.2 : isHovering ? 0.8 : 1 }}
                    animate={
                        isActive
                            ? 'active'
                            : isHovering
                            ? 'hovering'
                            : 'default'
                    }
                    variants={iconVars}
                />
            </button>
            {/* <motion.div
                initial="hidden"
                animate={freeCamActive ? 'active' : 'hidden'}
                variants={indicatorVars}
                style={Object.assign({}, styles.container, { marginLeft: 4 })}
                id="prevent-click"
            >
                <p
                    style={
                        window.innerWidth < 768
                            ? { fontSize: 8 }
                            : { fontSize: 10 }
                    }
                >
                    Free Cam Enabled
                </p>
            </motion.div> */}
        </div>
    );
};

const iconVars = {
    hovering: {
        opacity: 0.8,
        transition: {
            duration: 0.1,
            ease: 'easeOut',
        },
    },
    active: {
        scale: 0.8,
        opacity: 0.5,
        transition: {
            duration: 0.1,
            ease: Easing.expOut,
        },
    },
    default: {
        scale: 1,
        opacity: 1,
        transition: {
            duration: 0.2,
            ease: 'easeOut',
        },
    },
};

const styles: StyleSheetCSS = {
    container: {
        background: 'var(--bios-bg)',
        border: 0,
        padding: 0,
        textAlign: 'center',
        display: 'flex',
        boxSizing: 'border-box',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
    },
    wrapper: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
    },
};

export default FreeCamToggle;
