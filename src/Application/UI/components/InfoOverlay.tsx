import React, { useEffect, useRef, useState } from 'react';
import FreeCamToggle from './FreeCamToggle';
import MuteToggle from './MuteToggle';
import UIEventBus from '../EventBus';
import { prefersReducedMotion } from '../Animation';

interface InfoOverlayProps {
    visible: boolean;
}

const NAME_TEXT = 'Sean Pereira';
const TITLE_TEXT = 'Full-Stack & ML Engineer';
const MULTIPLIER = 1;

const InfoOverlay: React.FC<InfoOverlayProps> = ({ visible }) => {
    const visRef = useRef(visible);
    const [nameText, setNameText] = useState('');
    const [titleText, setTitleText] = useState('');
    const [time, setTime] = useState(new Date().toLocaleTimeString());
    const timeRef = useRef(time);
    const [timeText, setTimeText] = useState('');
    const [textDone, setTextDone] = useState(false);
    const [volumeVisible, setVolumeVisible] = useState(false);
    const [freeCamVisible, setFreeCamVisible] = useState(false);

    const typeText = (
        i: number,
        curText: string,
        text: string,
        setText: React.Dispatch<React.SetStateAction<string>>,
        callback: () => void,
        refOverride?: React.MutableRefObject<string>
    ) => {
        if (refOverride) {
            text = refOverride.current;
        }
        if (i < text.length) {
            setTimeout(() => {
                if (visRef.current === true)
                    window.postMessage(
                        { type: 'keydown', key: `_AUTO_${text[i]}` },
                        '*'
                    );

                setText(curText + text[i]);
                typeText(
                    i + 1,
                    curText + text[i],
                    text,
                    setText,
                    callback,
                    refOverride
                );
            }, Math.random() * 50 + 50 * MULTIPLIER);
        } else {
            callback();
        }
    };

    useEffect(() => {
        if (visible && nameText == '') {
            if (prefersReducedMotion()) {
                setNameText(NAME_TEXT);
                setTitleText(TITLE_TEXT);
                setTimeText(timeRef.current);
                setTextDone(true);
            } else {
                setTimeout(() => {
                    typeText(0, '', NAME_TEXT, setNameText, () => {
                        typeText(0, '', TITLE_TEXT, setTitleText, () => {
                            typeText(
                                0,
                                '',
                                time,
                                setTimeText,
                                () => {
                                    setTextDone(true);
                                },
                                timeRef
                            );
                        });
                    });
                }, 400);
            }
        }
        visRef.current = visible;
    }, [visible]);

    useEffect(() => {
        if (textDone) {
            const stagger = prefersReducedMotion() ? 0 : 250;
            setTimeout(() => {
                setVolumeVisible(true);
                setTimeout(() => {
                    setFreeCamVisible(true);
                }, stagger);
            }, stagger);
        }
    }, [textDone]);

    useEffect(() => {
        window.postMessage({ type: 'keydown', key: `_AUTO_` }, '*');
    }, [freeCamVisible, volumeVisible]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTime(new Date().toLocaleTimeString());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        timeRef.current = time;
        textDone && setTimeText(time);
    }, [time]);

    return (
        <div style={styles.wrapper}>
            {nameText !== '' && (
                <div style={styles.container}>
                    <p>{nameText}</p>
                </div>
            )}
            {titleText !== '' && (
                <div style={styles.container}>
                    <p>{titleText}</p>
                </div>
            )}
            {timeText !== '' && (
                <div style={styles.lastRow}>
                    <div
                        style={Object.assign(
                            {},
                            styles.container,
                            styles.lastRowChild
                        )}
                        className="info-row-item"
                    >
                        <p>{timeText}</p>
                    </div>
                    {volumeVisible && (
                        <div style={styles.lastRowChild}>
                            <MuteToggle />
                        </div>
                    )}
                    {freeCamVisible && (
                        <div style={styles.lastRowChild}>
                            <FreeCamToggle />
                        </div>
                    )}
                </div>
            )}
            {freeCamVisible && (
                <button
                    type="button"
                    className="bios-text-button info-row-item"
                    data-ui-control
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => UIEventBus.dispatch('requestEnterMonitor', {})}
                >
                    <p>Open SeanOS</p>
                </button>
            )}
        </div>
    );
};

const styles: StyleSheetCSS = {
    container: {
        background: 'var(--bios-bg)',
        padding: 4,
        paddingLeft: 16,
        paddingRight: 16,
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        marginBottom: 4,
        boxSizing: 'border-box',
    },
    wrapper: {
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
    },
    lastRow: {
        display: 'flex',
        flexDirection: 'row',
        marginBottom: 4,
    },
    lastRowChild: {
        marginRight: 4,
        marginBottom: 0,
    },
};

export default InfoOverlay;
