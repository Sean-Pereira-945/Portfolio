import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import UIEventBus from '../EventBus';
import InfoOverlay from './InfoOverlay';
import { prefersReducedMotion } from '../Animation';
import { isPhoneMode } from '../../Utils/Device';
import MuteToggle from './MuteToggle';

interface InterfaceUIProps {}

const InterfaceUI: React.FC<InterfaceUIProps> = ({}) => {
    const [initLoad, setInitLoad] = useState(true);
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [inMonitor, setInMonitor] = useState(false);
    const interfaceRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        UIEventBus.on('loadingScreenDone', () => {
            setLoading(false);
        });

        // find element by id and set ref
        const element = document.getElementById('ui-interactive');
        if (element) {
            // @ts-ignore
            interfaceRef.current = element;
        }
    }, []);

    const initInteractionHandler = () => {
        setVisible(true);
        setInitLoad(false);
    };

    useEffect(() => {
        if (!loading && initLoad) {
            // Show the overlay on the first click, tap or key press.
            document.addEventListener('mousedown', initInteractionHandler);
            document.addEventListener('keydown', initInteractionHandler);
            return () => {
                document.removeEventListener('mousedown', initInteractionHandler);
                document.removeEventListener('keydown', initInteractionHandler);
            };
        }
    }, [loading, initLoad]);

    useEffect(() => {
        UIEventBus.on('enterMonitor', () => {
            setVisible(false);
            setInitLoad(false);
            setInMonitor(true);
            if (interfaceRef.current) {
                interfaceRef.current.style.pointerEvents = 'none';
            }
        });
        UIEventBus.on('leftMonitor', () => {
            setVisible(true);
            setInMonitor(false);
            if (interfaceRef.current) {
                interfaceRef.current.style.pointerEvents = 'auto';
            }
        });
    }, []);

    const reduced = prefersReducedMotion();
    const vars = {
        visible: {
            opacity: 1,
            x: 0,
            visibility: 'visible' as const,
            transition: {
                duration: reduced ? 0 : 0.5,
                delay: reduced ? 0 : 0.3,
                ease: 'easeOut',
            },
        },
        hide: {
            x: reduced ? 0 : -32,
            opacity: 0,
            // Hidden controls must also leave the tab order.
            transitionEnd: { visibility: 'hidden' as const },
            transition: {
                duration: reduced ? 0 : 0.3,
                ease: 'easeOut',
            },
        },
    };

    if (isPhoneMode) {
        // The phone app carries the name and navigation; only sound control stays outside.
        return !loading ? (
            <div style={styles.phoneControls} data-ui-control>
                <MuteToggle />
            </div>
        ) : (
            <></>
        );
    }

    return !loading ? (
        <>
            <motion.div
                initial="hide"
                variants={vars}
                animate={visible ? 'visible' : 'hide'}
                style={styles.wrapper}
                className="interface-wrapper"
                data-ui-control
            >
                <InfoOverlay visible={visible} />
            </motion.div>
            {inMonitor && (
                <div style={styles.wrapper} className="interface-wrapper">
                    <button
                        type="button"
                        className="bios-text-button"
                        style={styles.backButton}
                        data-ui-control
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => UIEventBus.dispatch('requestLeaveMonitor', {})}
                    >
                        <p>Back to desk (Esc)</p>
                    </button>
                </div>
            )}
        </>
    ) : (
        <></>
    );
};

interface StyleSheetCSS {
    [key: string]: React.CSSProperties;
}

const styles: StyleSheetCSS = {
    wrapper: {
        width: '100%',
        display: 'flex',
        position: 'absolute',
        boxSizing: 'border-box',
    },
    phoneControls: {
        position: 'fixed',
        top: 16,
        right: 16,
    },
    backButton: {
        // The parent container stops pointer events while the monitor is open.
        pointerEvents: 'auto',
    },
};

export default InterfaceUI;
