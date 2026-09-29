import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import UIEventBus from '../EventBus';
import { Easing } from '../Animation';
// @ts-ignore
import volumeOn from '../../../../static/textures/UI/volume_on.svg';
// @ts-ignore
import volumeOff from '../../../../static/textures/UI/volume_off.svg';

interface MuteToggleProps {}

const MuteToggle: React.FC<MuteToggleProps> = ({}) => {
    const [isHovering, setIsHovering] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [muted, setMuted] = useState(false);

    useEffect(() => {
        UIEventBus.dispatch('muteToggle', muted);
    }, [muted]);

    return (
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
            onClick={() => setMuted(!muted)}
            style={styles.container}
            className="icon-control-container"
            data-ui-control
            aria-label="Mute sound"
            aria-pressed={muted}
        >
            <motion.img
                src={muted ? volumeOff : volumeOn}
                alt=""
                className="icon-control-image icon-mute"
                style={{ opacity: isActive ? 0.2 : isHovering ? 0.8 : 1 }}
                animate={
                    isActive ? 'active' : isHovering ? 'hovering' : 'default'
                }
                variants={iconVars}
            />
        </button>
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
};

export default MuteToggle;
